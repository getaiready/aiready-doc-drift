import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as d3 from 'd3';
import { cn } from '../utils/cn';
import NodeItem from './NodeItem';
import LinkItem from './LinkItem';

export interface GraphNode {
  id: string;
  label?: string;
  color?: string;
  size?: number;
  group?: string;
  kind?: 'file' | 'package';
  packageGroup?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  color?: string;
  width?: number;
  label?: string;
  type?: string;
}

export type LayoutType = 'force' | 'hierarchical' | 'circular';

export interface ForceDirectedGraphHandle {
  pinAll: () => void;
  unpinAll: () => void;
  resetLayout: () => void;
  fitView: () => void;
  getPinnedNodes: () => string[];
  setDragMode: (enabled: boolean) => void;
  setLayout: (layout: LayoutType) => void;
  getLayout: () => LayoutType;
}

export interface ForceDirectedGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width: number;
  height: number;
  enableZoom?: boolean;
  enableDrag?: boolean;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onLinkClick?: (link: GraphLink) => void;
  selectedNodeId?: string;
  hoveredNodeId?: string;
  defaultNodeColor?: string;
  defaultNodeSize?: number;
  defaultLinkColor?: string;
  defaultLinkWidth?: number;
  showNodeLabels?: boolean;
  showLinkLabels?: boolean;
  className?: string;
  manualLayout?: boolean;
  onManualLayoutChange?: (enabled: boolean) => void;
  packageBounds?: Record<string, { x: number; y: number; r: number }>;
  layout?: LayoutType;
  onLayoutChange?: (layout: LayoutType) => void;
}

export const ForceDirectedGraph = forwardRef<
  ForceDirectedGraphHandle,
  ForceDirectedGraphProps
>(
  (
    {
      nodes: initialNodes,
      links: initialLinks,
      width,
      height,
      enableZoom = true,
      enableDrag = true,
      onNodeClick,
      onNodeHover,
      onLinkClick,
      selectedNodeId,
      hoveredNodeId,
      defaultNodeColor = '#69b3a2',
      defaultNodeSize = 10,
      defaultLinkColor = '#999',
      defaultLinkWidth = 1,
      showNodeLabels = true,
      showLinkLabels = false,
      className,
      manualLayout = false,
      onManualLayoutChange,
      packageBounds,
      layout: externalLayout,
      onLayoutChange,
    },
    ref
  ) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
    const transformRef = useRef(transform);
    const dragNodeRef = useRef<GraphNode | null>(null);
    const dragActiveRef = useRef(false);
    const [pinnedNodes, setPinnedNodes] = useState<Set<string>>(new Set());
    const internalDragEnabledRef = useRef(enableDrag);
    const [layout, setLayout] = useState<LayoutType>(externalLayout || 'force');

    // Sync external layout prop with internal state
    useEffect(() => {
      if (externalLayout && externalLayout !== layout) {
        setLayout(externalLayout);
      }
    }, [externalLayout]);

    // Handle layout change and notify parent
    const handleLayoutChange = useCallback(
      (newLayout: LayoutType) => {
        setLayout(newLayout);
        onLayoutChange?.(newLayout);
      },
      [onLayoutChange]
    );

    // Update the ref when enableDrag prop changes
    useEffect(() => {
      internalDragEnabledRef.current = enableDrag;
    }, [enableDrag]);

    // Static layout - compute positions directly without force simulation
    const nodes = React.useMemo(() => {
      if (!initialNodes || !initialNodes.length) return initialNodes;

      const centerX = width / 2;
      const centerY = height / 2;

      // For force layout, use random positions but don't animate
      if (layout === 'force') {
        return initialNodes.map((n: any) => ({
          ...n,
          x: Math.random() * width,
          y: Math.random() * height,
        }));
      }

      // For circular layout, arrange in a circle
      if (layout === 'circular') {
        const radius = Math.min(width, height) * 0.35;
        return initialNodes.map((n: any, i: number) => ({
          ...n,
          x:
            centerX +
            Math.cos((2 * Math.PI * i) / initialNodes.length) * radius,
          y:
            centerY +
            Math.sin((2 * Math.PI * i) / initialNodes.length) * radius,
        }));
      }

      // For hierarchical layout, arrange in a grid
      if (layout === 'hierarchical') {
        const cols = Math.ceil(Math.sqrt(initialNodes.length));
        const spacingX = width / (cols + 1);
        const spacingY = height / (Math.ceil(initialNodes.length / cols) + 1);
        return initialNodes.map((n: any, i: number) => ({
          ...n,
          x: spacingX * ((i % cols) + 1),
          y: spacingY * (Math.floor(i / cols) + 1),
        }));
      }

      return initialNodes;
    }, [initialNodes, width, height, layout]);

    // Static links - just use initial links
    const links = initialLinks;

    // No force simulation - static layout only
    const restart = React.useCallback(() => {
      // No-op for static layout
    }, []);

    const stop = React.useCallback(() => {
      // No-op for static layout
    }, []);

    const setForcesEnabled = React.useCallback((enabled?: boolean) => {
      // No-op for static layout; accept optional `enabled` arg for API compatibility
      void enabled;
    }, []);

    // Remove package bounds effect - boundary packing disabled for faster convergence

    // Apply layout-specific positioning when layout changes
    useEffect(() => {
      if (!nodes || nodes.length === 0) return;

      const applyLayout = () => {
        const centerX = width / 2;
        const centerY = height / 2;

        if (layout === 'circular') {
          // Place all nodes in a circle
          const radius = Math.min(width, height) * 0.35;
          nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            node.fx = centerX + Math.cos(angle) * radius;
            node.fy = centerY + Math.sin(angle) * radius;
          });
        } else if (layout === 'hierarchical') {
          // Place packages in rows, files within packages in columns
          const groups = new Map<string, typeof nodes>();
          nodes.forEach((n: any) => {
            const key = n.packageGroup || n.group || 'root';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(n);
          });

          const groupArray = Array.from(groups.entries());
          const cols = Math.ceil(Math.sqrt(groupArray.length));
          const groupSpacingX = (width * 0.8) / cols;
          const groupSpacingY =
            (height * 0.8) / Math.ceil(groupArray.length / cols);

          groupArray.forEach(([groupKey, groupNodes], gi) => {
            const col = gi % cols;
            const row = Math.floor(gi / cols);
            const groupX = (col + 0.5) * groupSpacingX;
            const groupY = (row + 0.5) * groupSpacingY;

            // Place group nodes in a small circle within their area
            if (groupKey.startsWith('pkg:') || groupKey === groupKey) {
              groupNodes.forEach((n, ni) => {
                const angle = (2 * Math.PI * ni) / groupNodes.length;
                const r = Math.min(80, 20 + groupNodes.length * 8);
                n.fx = groupX + Math.cos(angle) * r;
                n.fy = groupY + Math.sin(angle) * r;
              });
            }
          });
        }
        // 'force' layout - just restart with default behavior (no fx/fy set)

        try {
          restart();
        } catch (e) {
          void e;
        }
      };

      applyLayout();
    }, [layout, nodes, width, height, restart]);

    // If manual layout is enabled or any nodes are pinned, disable forces
    useEffect(() => {
      try {
        if (manualLayout || pinnedNodes.size > 0) setForcesEnabled(false);
        else setForcesEnabled(true);
      } catch (e) {
        void e;
      }
    }, [manualLayout, pinnedNodes, setForcesEnabled]);

    // Expose imperative handle for parent components
    useImperativeHandle(
      ref,
      () => ({
        pinAll: () => {
          const newPinned = new Set<string>();
          nodes.forEach((node) => {
            node.fx = node.x;
            node.fy = node.y;
            newPinned.add(node.id);
          });
          setPinnedNodes(newPinned);
          restart();
        },

        unpinAll: () => {
          nodes.forEach((node) => {
            node.fx = null;
            node.fy = null;
          });
          setPinnedNodes(new Set());
          restart();
        },

        resetLayout: () => {
          nodes.forEach((node) => {
            node.fx = null;
            node.fy = null;
          });
          setPinnedNodes(new Set());
          restart();
        },

        fitView: () => {
          if (!svgRef.current || !nodes.length) return;

          // Calculate bounds
          let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
          nodes.forEach((node) => {
            if (node.x !== undefined && node.y !== undefined) {
              const size = node.size || 10;
              minX = Math.min(minX, node.x - size);
              maxX = Math.max(maxX, node.x + size);
              minY = Math.min(minY, node.y - size);
              maxY = Math.max(maxY, node.y + size);
            }
          });

          if (!isFinite(minX)) return;

          const padding = 40;
          const nodeWidth = maxX - minX;
          const nodeHeight = maxY - minY;
          const scale = Math.min(
            (width - padding * 2) / nodeWidth,
            (height - padding * 2) / nodeHeight,
            10
          );

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          const x = width / 2 - centerX * scale;
          const y = height / 2 - centerY * scale;

          if (gRef.current && svgRef.current) {
            const svg = d3.select(svgRef.current);
            const newTransform = d3.zoomIdentity.translate(x, y).scale(scale);
            svg
              .transition()
              .duration(300)
              .call((d3 as any).zoom().transform as any, newTransform);
            setTransform(newTransform);
          }
        },

        getPinnedNodes: () => Array.from(pinnedNodes),

        setDragMode: (enabled: boolean) => {
          internalDragEnabledRef.current = enabled;
        },

        setLayout: (newLayout: LayoutType) => {
          handleLayoutChange(newLayout);
        },

        getLayout: () => layout,
      }),
      [nodes, pinnedNodes, restart, width, height, layout, handleLayoutChange]
    );

    // Notify parent when manual layout mode changes (uses the prop so it's not unused)
    useEffect(() => {
      try {
        if (typeof onManualLayoutChange === 'function')
          onManualLayoutChange(manualLayout);
      } catch (e) {
        void e;
      }
    }, [manualLayout, onManualLayoutChange]);

    // Set up zoom behavior
    useEffect(() => {
      if (!enableZoom || !svgRef.current || !gRef.current) return;

      const svg = d3.select(svgRef.current);
      const g = d3.select(gRef.current);

      const zoom = (d3 as any)
        .zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event: any) => {
          g.attr('transform', event.transform);
          transformRef.current = event.transform;
          setTransform(event.transform);
        });

      svg.call(zoom);

      return () => {
        svg.on('.zoom', null);
      };
    }, [enableZoom]);

    // Run a one-time DOM positioning pass when nodes/links change so elements
    // rendered by React are positioned to the simulation's seeded coordinates
    useEffect(() => {
      if (!gRef.current) return;
      try {
        const g = d3.select(gRef.current);
        g.selectAll('g.node').each(function (this: any) {
          const datum = d3.select(this).datum() as any;
          if (!datum) return;
          d3.select(this).attr(
            'transform',
            `translate(${datum.x || 0},${datum.y || 0})`
          );
        });

        g.selectAll('line').each(function (this: any) {
          const l = d3.select(this).datum() as any;
          if (!l) return;
          const s: any =
            typeof l.source === 'object'
              ? l.source
              : nodes.find((n) => n.id === l.source) || l.source;
          const t: any =
            typeof l.target === 'object'
              ? l.target
              : nodes.find((n) => n.id === l.target) || l.target;
          if (!s || !t) return;
          d3.select(this)
            .attr('x1', s.x)
            .attr('y1', s.y)
            .attr('x2', t.x)
            .attr('y2', t.y);
        });
      } catch (e) {
        void e;
      }
    }, [nodes, links]);

    // Set up drag behavior with global listeners for smoother dragging
    const handleDragStart = useCallback(
      (event: React.MouseEvent, node: GraphNode) => {
        if (!enableDrag) return;
        event.preventDefault();
        event.stopPropagation();
        // pause forces while dragging to avoid the whole graph moving
        dragActiveRef.current = true;
        dragNodeRef.current = node;
        node.fx = node.x;
        node.fy = node.y;
        setPinnedNodes((prev) => new Set([...prev, node.id]));
        try {
          stop();
        } catch (e) {
          void e;
        }
      },
      [enableDrag, restart]
    );

    useEffect(() => {
      if (!enableDrag) return;

      const handleWindowMove = (event: MouseEvent) => {
        if (!dragActiveRef.current || !dragNodeRef.current) return;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const t: any = transformRef.current;
        const x = (event.clientX - rect.left - t.x) / t.k;
        const y = (event.clientY - rect.top - t.y) / t.k;
        dragNodeRef.current.fx = x;
        dragNodeRef.current.fy = y;
      };

      const handleWindowUp = () => {
        if (!dragActiveRef.current) return;
        // Keep fx/fy set to pin the node where it was dropped.
        try {
          setForcesEnabled(true);
          restart();
        } catch (e) {
          void e;
        }
        dragNodeRef.current = null;
        dragActiveRef.current = false;
      };

      const handleWindowLeave = (event: MouseEvent) => {
        if (event.relatedTarget === null) handleWindowUp();
      };

      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
      window.addEventListener('mouseout', handleWindowLeave);
      window.addEventListener('blur', handleWindowUp);

      return () => {
        window.removeEventListener('mousemove', handleWindowMove);
        window.removeEventListener('mouseup', handleWindowUp);
        window.removeEventListener('mouseout', handleWindowLeave);
        window.removeEventListener('blur', handleWindowUp);
      };
    }, [enableDrag]);

    // Attach d3.drag behavior to node groups rendered by React. This helps make
    // dragging more robust across transforms and pointer behaviors.
    useEffect(() => {
      if (!gRef.current || !enableDrag) return;
      const g = d3.select(gRef.current);
      const dragBehavior = (d3 as any)
        .drag()
        .on('start', function (this: any, event: any) {
          try {
            const target =
              (event.sourceEvent && (event.sourceEvent.target as Element)) ||
              (event.target as Element);
            const grp = target.closest?.('g.node') as Element | null;
            const id = grp?.getAttribute('data-id');
            if (!id) return;
            const node = nodes.find((n) => n.id === id) as
              | GraphNode
              | undefined;
            if (!node) return;
            if (!internalDragEnabledRef.current) return;
            if (!event.active) restart();
            dragActiveRef.current = true;
            dragNodeRef.current = node;
            node.fx = node.x;
            node.fy = node.y;
            setPinnedNodes((prev) => new Set([...prev, node.id]));
          } catch (e) {
            void e;
          }
        })
        .on('drag', function (this: any, event: any) {
          if (!dragActiveRef.current || !dragNodeRef.current) return;
          const svg = svgRef.current;
          if (!svg) return;
          const rect = svg.getBoundingClientRect();
          const x =
            (event.sourceEvent.clientX - rect.left - transform.x) / transform.k;
          const y =
            (event.sourceEvent.clientY - rect.top - transform.y) / transform.k;
          dragNodeRef.current.fx = x;
          dragNodeRef.current.fy = y;
        })
        .on('end', function () {
          // re-enable forces when drag ends
          try {
            setForcesEnabled(true);
            restart();
          } catch (e) {
            void e;
          }
        });

      try {
        g.selectAll('g.node').call(dragBehavior as any);
      } catch (e) {
        void e;
      }

      return () => {
        try {
          g.selectAll('g.node').on('.drag', null as any);
        } catch (e) {
          void e;
        }
      };
    }, [gRef, enableDrag, nodes, transform, restart]);

    const handleNodeClick = useCallback(
      (node: GraphNode) => {
        onNodeClick?.(node);
      },
      [onNodeClick]
    );

    const handleNodeDoubleClick = useCallback(
      (event: React.MouseEvent, node: GraphNode) => {
        event.stopPropagation();
        if (!enableDrag) return;
        if (node.fx === null || node.fx === undefined) {
          node.fx = node.x;
          node.fy = node.y;
          setPinnedNodes((prev) => new Set([...prev, node.id]));
        } else {
          node.fx = null;
          node.fy = null;
          setPinnedNodes((prev) => {
            const next = new Set(prev);
            next.delete(node.id);
            return next;
          });
        }
        restart();
      },
      [enableDrag, restart]
    );

    const handleCanvasDoubleClick = useCallback(() => {
      nodes.forEach((node) => {
        node.fx = null;
        node.fy = null;
      });
      setPinnedNodes(new Set());
      restart();
    }, [nodes, restart]);

    const handleNodeMouseEnter = useCallback(
      (node: GraphNode) => {
        onNodeHover?.(node);
      },
      [onNodeHover]
    );

    const handleNodeMouseLeave = useCallback(() => {
      onNodeHover?.(null);
    }, [onNodeHover]);

    const handleLinkClick = useCallback(
      (link: GraphLink) => {
        onLinkClick?.(link);
      },
      [onLinkClick]
    );

    return (
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={cn('bg-white dark:bg-gray-900', className)}
        onDoubleClick={handleCanvasDoubleClick}
      >
        <defs>
          {/* Arrow marker for directed graphs */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={defaultLinkColor} />
          </marker>
        </defs>

        <g ref={gRef}>
          {/* Render links via LinkItem (positions updated by D3) */}
          {links.map((link, i) => (
            <LinkItem
              key={`link-${i}`}
              link={link as GraphLink}
              onClick={handleLinkClick}
              defaultWidth={defaultLinkWidth}
              showLabel={showLinkLabels}
              nodes={nodes}
            />
          ))}

          {/* Render nodes via NodeItem (D3 will set transforms) */}
          {nodes.map((node) => (
            <NodeItem
              key={node.id}
              node={node as GraphNode}
              isSelected={selectedNodeId === node.id}
              isHovered={hoveredNodeId === node.id}
              pinned={pinnedNodes.has(node.id)}
              defaultNodeSize={defaultNodeSize}
              defaultNodeColor={defaultNodeColor}
              showLabel={showNodeLabels}
              onClick={handleNodeClick}
              onDoubleClick={handleNodeDoubleClick}
              onMouseEnter={handleNodeMouseEnter}
              onMouseLeave={handleNodeMouseLeave}
              onMouseDown={handleDragStart}
            />
          ))}
          {/* Package boundary circles (from parent pack layout) - drawn on top for visibility */}
          {packageBounds && Object.keys(packageBounds).length > 0 && (
            <g className="package-boundaries" pointerEvents="none">
              {Object.entries(packageBounds).map(([pid, b]) => (
                <g key={pid}>
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={b.r}
                    fill="rgba(148,163,184,0.06)"
                    stroke="#475569"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    opacity={0.9}
                  />
                  <text
                    x={b.x}
                    y={Math.max(12, b.y - b.r + 14)}
                    fill="#475569"
                    fontSize={11}
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {pid.replace(/^pkg:/, '')}
                  </text>
                </g>
              ))}
            </g>
          )}
        </g>
      </svg>
    );
  }
);

ForceDirectedGraph.displayName = 'ForceDirectedGraph';
