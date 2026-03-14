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
