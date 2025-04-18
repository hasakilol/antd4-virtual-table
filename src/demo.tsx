import React, { useCallback, useEffect, useRef, useState } from "react";
import "antd/dist/antd.css";
import "./index.css";
import { Table, Button } from "antd";
import type { TableProps } from "antd";
import classNames from "classnames";
import ResizeObserver from "rc-resize-observer";

import { VariableSizeGrid as Grid } from "react-window";

const VirtualTable = <RecordType extends object>(
  props: TableProps<RecordType>
) => {
  const { columns, scroll } = props;
  const [tableWidth, setTableWidth] = useState(0);
  const [controlledColumns, setControlledColumns] = useState(columns);

  const widthColumnCount = controlledColumns!.filter(
    ({ width }) => !width
  ).length;
  const mergedColumns = controlledColumns!.map((column) => {
    if (column.width) {
      return column;
    }

    return {
      ...column,
      width: Math.floor(tableWidth / widthColumnCount),
    };
  });

  const gridRef = useRef<any>();
  const [connectObject] = useState<any>(() => {
    const obj = {};
    Object.defineProperty(obj, "scrollLeft", {
      get: () => {
        if (gridRef.current) {
          return gridRef.current?.state?.scrollLeft;
        }
        return null;
      },
      set: (scrollLeft: number) => {
        if (gridRef.current) {
          gridRef.current.scrollTo({ scrollLeft });
        }
      },
    });

    return obj;
  });

  const resetVirtualGrid = () => {
    gridRef.current?.resetAfterIndices({
      columnIndex: 0,
      shouldForceUpdate: true,
    });
  };

  useEffect(() => resetVirtualGrid, [tableWidth]);

  const handleClick = useCallback(() => {
    setControlledColumns((prev) => {
      return prev.map((column, idx) =>
        idx < prev.length - 1 ? { ...column, width: 200 } : column
      );
    });
  }, []);

  console.log(controlledColumns);

  const renderVirtualList = (
    rawData: object[],
    { scrollbarSize, ref, onScroll }: any
  ) => {
    ref.current = connectObject;
    const totalHeight = rawData.length * 54;

    return (
      <Grid
        ref={gridRef}
        className="virtual-grid"
        columnCount={mergedColumns.length}
        columnWidth={(index: number) => {
          const { width } = mergedColumns[index];
          return totalHeight > scroll!.y! && index === mergedColumns.length - 1
            ? (width as number) - scrollbarSize - 1
            : (width as number);
        }}
        height={scroll!.y as number}
        rowCount={rawData.length}
        rowHeight={() => 54}
        width={tableWidth}
        onScroll={({ scrollLeft }: { scrollLeft: number }) => {
          onScroll({ scrollLeft });
        }}
      >
        {({
          columnIndex,
          rowIndex,
          style,
        }: {
          columnIndex: number;
          rowIndex: number;
          style: React.CSSProperties;
        }) => (
          <div
            className={classNames("virtual-table-cell", {
              "virtual-table-cell-last":
                columnIndex === mergedColumns.length - 1,
            })}
            style={style}
          >
            {
              (rawData[rowIndex] as any)[
                (mergedColumns as any)[columnIndex].dataIndex
              ]
            }
          </div>
        )}
      </Grid>
    );
  };

  return (
    <>
      <ResizeObserver
        onResize={({ width }) => {
          setTableWidth(width);
        }}
      >
        <Table
          {...props}
          className="virtual-table"
          columns={mergedColumns}
          pagination={false}
          components={{
            body: renderVirtualList,
          }}
        />
      </ResizeObserver>
      <Button onClick={handleClick}>Change columns</Button>
    </>
  );
};

// Usage
const columns = [
  { title: "A", dataIndex: "key", width: 150 },
  { title: "B", dataIndex: "key", width: 50 },
  { title: "C", dataIndex: "key" },
];

const data = Array.from({ length: 100000 }, (_, key) => ({ key }));

const App: React.FC = () => (
  <VirtualTable
    columns={columns}
    dataSource={data}
    scroll={{ y: 300, x: 400 }}
  />
);

export default App;
