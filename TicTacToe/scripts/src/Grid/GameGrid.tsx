import React from "react";
import "./Styles/Grid.css";
import { Box, Grid, Button, Typography } from "@mui/material";

const cellSize = 30;

export type CellValue = {
    mark: null | "X" | "O";
    latest: boolean;
}

type CellProps = {
    row: number;
    col: number;
    value: CellValue;
    onClick: (r: number, c: number) => void;
};

type GridProps = {
    size?: number;
    values?: CellValue[][];
    onCellClick: (r: number, c: number) => void;
    renderCell?: (r: number, c: number, value: CellValue) => React.ReactNode;
};

const Cell = React.memo(({ row, col, value, onClick }: CellProps) => {
    return (
        <Grid>
            <Button
                variant="outlined"
                sx={{
                    aspectRatio: "1 / 1",
                    minWidth: 40,
                    fontSize: "1.5rem",
                    padding: 0,
                    margin: 0,
                    lineHeight: 1,
                }}
                onClick={() => onClick(row, col)}
                aria-label={`cell-${row}-${col}`}
                data-row={row}
                data-col={col}
            >
                <Typography variant="h5" component="center">
                    {value.mark ?? ""}
                </Typography>
            </Button>
        </Grid>
    );
});

const GameGrid = ({ size = 10, values, onCellClick }: GridProps) => {
    const rows = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => values?.[r]?.[c] ?? null)
    );

    return (
        <Box
            overflow="auto"
            display="flex"
            justifyContent="center"
            width="100%"
        >
            <Box
                display="grid"
                gridTemplateColumns={`repeat(${size}, ${cellSize}px)`}
                overflow="auto"
            >
                {rows.flatMap((rowArr, r) =>
                    rowArr.map((val, c) => (
                        <Button
                            key={`${r}-${c}`}
                            variant="outlined"
                            sx={{
                                aspectRatio: "1 / 1",
                                width: cellSize,
                                fontSize: "1.5rem",
                                padding: 0,
                                minWidth: 0,
                                backgroundColor: val?.latest ? "#bbbbbb" : "#ffffff"
                            }}
                            onClick={() => onCellClick(r, c)}
                        >
                            <Typography variant="h5" component="span" fontSize="70%">
                                {val?.mark ?? ""}
                            </Typography>
                        </Button>
                    ))
                )}
            </Box>
        </Box>
    );
};

export default GameGrid;