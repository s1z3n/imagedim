
export type Point = {
  x: number;
  y: number;
};

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface Annotation {
  id: string;
  label: string; // e.g., "Overall Height: 34.5"
  valueText: string; // e.g., "34.5"
  p1: Point; // Dimension line start
  p2: Point; // Dimension line end
  labelPos: Point;
  ext1?: Point; // Extension line 1 start (on product)
  ext2?: Point; // Extension line 2 start (on product)
  lineColor?: string;
  lineStyle?: LineStyle;
}

export interface StyleOptions {
  strokeWidth: number;
  arrowheadSize: number;
  lineColor: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  showLabelBox: boolean;
  labelBoxPadding: number;
  labelBoxColor: string;
}

export type DraggablePart = 'p1' | 'p2' | 'label' | 'line';
export type Action = 
  | { type: 'add'; payload: Annotation[] }
  | { type: 'update'; payload: Annotation }
  | { type: 'delete'; payload: string }
  | { type: 'clear' }
  | { type: 'set'; payload: Annotation[] };