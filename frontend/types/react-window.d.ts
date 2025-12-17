import type { ComponentType, CSSProperties } from 'react';

declare module 'react-window' {
  export interface GridChildComponentProps<Data = any> {
    columnIndex: number;
    data: Data;
    rowIndex: number;
    style: CSSProperties;
    isScrolling?: boolean;
  }

  export interface FixedSizeGridProps<Data = any> {
    className?: string;
    columnCount: number;
    columnWidth: number;
    height: number;
    itemData?: Data;
    onItemsRendered?: (props: {
      overscanRowStartIndex: number;
      overscanRowStopIndex: number;
      overscanColumnStartIndex: number;
      overscanColumnStopIndex: number;
      visibleRowStartIndex: number;
      visibleRowStopIndex: number;
      visibleColumnStartIndex: number;
      visibleColumnStopIndex: number;
    }) => void;
    rowCount: number;
    rowHeight: number;
    style?: CSSProperties;
    width: number;
  }

  export const FixedSizeGrid: ComponentType<FixedSizeGridProps>;
}
