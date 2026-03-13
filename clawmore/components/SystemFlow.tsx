'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  MarkerType,
  ConnectionLineType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeStyles = {
  // Brighter background and clearer borders for "Agent" cards
  agent:
    'px-4 py-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-sm bg-zinc-800 border border-white/40 text-white font-mono text-[10px] uppercase tracking-widest font-bold',
  // Cyber-purple glow for "Bus" nodes
  bus: 'px-6 py-3 shadow-[0_0_30px_rgba(188,0,255,0.3)] rounded-sm bg-cyber-purple/30 border-2 border-cyber-purple text-white font-black font-mono text-[12px] uppercase tracking-[0.3em]',
  // Distinct pill style for "Event" nodes
  event:
    'px-3 py-1 shadow-md rounded-full bg-zinc-700 border border-white/50 text-white font-mono text-[8px] uppercase tracking-tighter font-bold',
};

interface SystemFlowProps {
  nodes: Node[];
  edges: Edge[];
  height?: string;
}

export default function SystemFlow({
  nodes,
  edges,
  height = '400px',
}: SystemFlowProps) {
  // Improved edges with better label styling
  const defaultEdgeOptions = {
    animated: true,
    style: { stroke: '#bc00ff', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#bc00ff',
    },
    // Fix: Using a semi-transparent dark background for labels instead of bright white
    labelStyle: { fill: '#ffffff', fontWeight: 700, fontSize: '10px' },
    labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.8 },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 2,
  };

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        className:
          node.data?.type === 'bus'
            ? nodeStyles.bus
            : node.data?.type === 'event'
              ? nodeStyles.event
              : nodeStyles.agent,
        style: { ...node.style, background: 'transparent', border: 'none' },
      })),
    [nodes]
  );

  return (
    <div
      style={{ height }}
      className="w-full glass-card border-white/10 overflow-hidden my-12 bg-black/40"
    >
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={false}
      >
        {/* Slightly darker background dots for better node contrast */}
        <Background
          color="#333"
          gap={20}
          variant={BackgroundVariant.Dots}
          size={1}
        />
        <Controls
          showInteractive={false}
          className="opacity-20 hover:opacity-100 transition-opacity"
        />
      </ReactFlow>
    </div>
  );
}
