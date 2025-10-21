import React from "react";
import "./Styles/Grid.css";

export type CellValue = null | "X" | "O";

interface GridProps {
    size?: number; // grid width/height (default 10)
    values: CellValue[][]; // values[row][col]
    onCellClick: (row: number, col: number) => void;
    renderCell?: (value: CellValue) => React.ReactNode;
}

const Cell: React.FC<{
    row: number;
    col: number;
    value: CellValue;
    onClick: (r: number, c: number) => void;
}> = React.memo(({ row, col, value, onClick }) => {
    return (
        <button
            className="ttt-cell"
            onClick={() => onClick(row, col)}
            aria-label={`cell-${row}-${col}`}
            data-row={row}
            data-col={col}
        >
            <span className="cell-content">{value ?? ""}</span>
        </button>
    );
});

export const Grid: React.FC<GridProps> = ({
                                              size = 10,
                                              values,
                                              onCellClick,
                                              renderCell,
                                          }) => {
    // Ensure values shape
    const rows = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => values?.[r]?.[c] ?? null)
    );

    return (
        <div
            className="ttt-grid"
            style={{
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gridTemplateRows: `repeat(${size}, 1fr)`,
            }}
            role="grid"
        >
            {rows.map((rowArr, r) =>
                rowArr.map((val, c) => (
                    <Cell
                        key={`${r}-${c}`}
                        row={r}
                        col={c}
                        value={val}
                        onClick={onCellClick}
                    />
                ))
            )}
        </div>
    );
};

export default Grid;
