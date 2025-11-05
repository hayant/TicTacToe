import React, {useCallback, useEffect, useState} from "react";
import Grid from "./GameGrid";
import {Authorization} from "../../Helpers/Authorization";
import {Container, AppBar, Box, Typography, Stack, Toolbar, Button} from "@mui/material"
import {useNavigate} from "react-router";
import {HttpHelpers} from "../../Helpers/HttpHelpers";
import {CellValue} from "../../Data/CellValue";
import {findBestMove} from "../../Helpers/AIHelpers";

const SIZE = 20;

function createEmpty(size = SIZE): CellValue[][] {
    return Array.from({ length: size }, ():CellValue[] =>
        Array.from({ length: size }, (): CellValue => ({ mark: null, latest: false }))
    );
}

export default function GameView() {
    const [board, setBoard] = useState<CellValue[][]>(() => createEmpty());
    const [turn, setTurn] = useState<CellValue>({ mark: "X", latest: true}); // X or O
    const [turnCount, setTurnCount] = useState(1);
    const [gameTime, setGameTime] = useState("00:00:00");
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const navigate = useNavigate();
    const singlePlayerGame = true;
    
    Authorization.checkAuthentication();

    const checkForVictory = (next: CellValue[][], row: number, col: number): [CellValue[][], boolean] => {
        // Horizontal, Vertical, Diagonal /, Diagonal \
        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 },
        ];

        for (const { dr, dc } of directions) {
            let count = 1;

            // Check in the positive direction
            for (let step = 1; step < 5; step++) {
                const r = row + dr * step;
                const c = col + dc * step;
                if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || next[r][c].mark !== turn.mark) {
                    break;
                }
                count++;
            }

            // Check in the negative direction
            for (let step = 1; step < 5; step++) {
                const r = row - dr * step;
                const c = col - dc * step;
                if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || next[r][c].mark !== turn.mark) {
                    break;
                }
                count++;
            }

            if (count >= 5) {
                // Mark winning cells
                for (let step = -4; step <= 4; step++) {
                    const r = row + dr * step;
                    const c = col + dc * step;
                    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
                        continue;
                    }
                    if (next[r][c].mark === turn.mark) {
                        next[r][c] = { mark: next[r][c].mark, latest: true };
                    }
                }
                return [next, true];
            }
        }
        return [next, false]; // TODO
    }

    const handleCellClick = useCallback(async (row: number, col: number) => {
        if (gameOver || board[row][col].mark !== null) {
            return;
        }
        
        setError(null);
        
        let next = board.map((r) => r.map(c => ({ mark: c.mark, latest: false })));
        next[row][col] = { mark: turn.mark, latest: true };

        let victory = false;
        [next, victory] = checkForVictory(next, row, col);
        
        setBoard(next);
        
        if (victory) {
            setError(`Player ${turn.mark} wins!`);
            setGameOver(true);
            return;
        }
        
        if (singlePlayerGame) {
            setTurn({ mark: "O", latest: true });
        } else {
            setTurn(t => (t.mark === "X" ? { mark: "O", latest: true } : { mark: "X", latest: true }));
        }
        
        if (turn.mark === "O") {
            setTurnCount((count) => count + 1);
        }
    }, [turn, board]);

    const handleAIMove = useCallback(() => {
        if (!singlePlayerGame) {
            return;
        }
        
        let next = board.map((r) => r.map(c => ({ mark: c.mark, latest: false })));
        const move = findBestMove(next);

        next[move?.row ?? 0][move?.col ?? 0] = { mark: "O", latest: true };

        // Check for victory.
        let victory = false;
        [next, victory] = checkForVictory(next, move?.row ?? 0, move?.col ?? 0);

        setBoard(next);
        setTurn({ mark: "X", latest: true });
        
        if (victory) {
            setError(`Player ${turn.mark} wins!`);
            setGameOver(true);
            return;
        }
    }, [board]);

    useEffect(() => {
        if (singlePlayerGame && turn.mark === "O") {
            handleAIMove();
        }
    }, [turn, singlePlayerGame, handleAIMove]);
    
    const handleReset = () => {
        setBoard(createEmpty());
        setTurn({mark: "X", latest: true});
    };

    const handleQuit = () => {
        navigate("/app");
    }

    return (
        <Container sx={{ width: "100%", alignContent: "center", justifyContent: "center", display: "flex" }}>
            <Stack width="100%" justifyContent="center" alignContent="center">
                <AppBar
                    position="static"
                    sx={{
                        backgroundColor: "#1976d2", // default MUI blue
                        // width: 500,
                        margin: "20px auto", // centers horizontally
                        borderRadius: 2,
                    }}
                >
                    <Toolbar>
                        <Typography variant="h6" component="div" fontFamily={"fantasy"} fontSize="24px">
                            TicTacToe
                        </Typography>

                        <Box sx={{ flexGrow: 1 }} />

                        <Box sx={{ flexGrow: 4 }}>
                            <Typography
                                sx={{
                                    padding: "2px",
                                }}
                            >
                                <strong>Turn {turnCount}:</strong> {turn.mark}
                            </Typography>
                            <Typography
                                sx={{
                                    padding: "2px",
                                }}
                            >
                                <strong>Time elapsed:</strong> {gameTime}
                            </Typography>
                        </Box>
                        <Button onClick={handleReset} color="inherit">
                            Reset
                        </Button>
                        <Button onClick={handleQuit} color="inherit">
                            Quit
                        </Button>
                    </Toolbar>
                </AppBar>
                <Grid size={SIZE} values={board} onCellClick={handleCellClick} />
                <Typography
                    // justifyContent="center"
                    sx={{
                        padding: "2px",
                        color: "#f00",
                        width: "100%",
                        textAlign: "center",
                    }}
                >
                    {error}
                </Typography>
            </Stack>
        </Container>
    );
}
