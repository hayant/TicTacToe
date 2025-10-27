import React, {useCallback, useEffect, useState} from "react";
import Grid, { CellValue } from "../Grid/Grid";
import {HttpHelpers} from "../Helpers/HttpHelpers";
import {useNavigate} from "react-router";
import {Authorization} from "../Helpers/Authorization";

const SIZE = 20;

function createEmpty(size = SIZE): CellValue[][] {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => null)
    );
}

export default function GameView() {
    const [board, setBoard] = useState<CellValue[][]>(() => createEmpty());
    const [turn, setTurn] = useState<CellValue>("X"); // X or O
    
    Authorization.checkAuthentication();
    
    const handleCellClick = useCallback((row: number, col: number) => {
        setBoard((prev) => {
            // ignore if already filled
            if (prev[row][col] !== null) {
                return prev;
            }

            // handle next move
            const next = prev.map((r) => r.slice());
            next[row][col] = turn;
            setTurn((t) => (t === "X" ? "O" : "X"));
            return next;
        });
    }, [turn]);

    const handleReset = () => {
        setBoard(createEmpty());
        setTurn("X");
    };

    return (
        <div style={{ padding: 20 }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 900, margin: "0px 0px 0px 0px" }}>
                <h1 style={{ margin: 0 }}>TicTacToe</h1>
                <div>
                    <strong>Turn:</strong> {turn}{" "}
                    <button onClick={handleReset} style={{ marginLeft: 12 }}>Reset</button>
                </div>
            </header>

            <main>
                <Grid size={SIZE} values={board} onCellClick={handleCellClick} />
            </main>
        </div>
    );
}
