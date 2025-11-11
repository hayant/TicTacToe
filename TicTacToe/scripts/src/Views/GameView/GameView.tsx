import React, {useCallback, useEffect, useState} from "react";
import Grid from "./GameGrid";
import {Authorization} from "../../Helpers/Authorization";
import {AppBar, Box, Button, Container, Stack, Toolbar, Typography} from "@mui/material"
import {useLocation, useNavigate} from "react-router";
import {CellValue} from "../../Data/CellValue";
import {findBestMove} from "../../Helpers/AIHelpers";
import {GameMode} from "../../Data/GameMode";
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

const SIZE = 20;

export type GameViewProps = {
    gameMode: GameMode;
    opponentUsername?: string;
    iAmX?: boolean;
}

export function createEmpty(size = SIZE): CellValue[][] {
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
    const [connection, setConnection] = useState<HubConnection | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    
    const state = location.state as GameViewProps;

    Authorization.checkAuthentication();

    const checkForVictory = (next: CellValue[][], row: number, col: number): [CellValue[][], boolean] => {
        const placedMark = next[row][col].mark;
        if (!placedMark) return [next, false];

        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 },
        ];

        for (const { dr, dc } of directions) {
            let count = 1;

            // Positive direction
            for (let step = 1; step < 5; step++) {
                const r = row + dr * step;
                const c = col + dc * step;
                if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || next[r][c].mark !== placedMark) break;
                count++;
            }

            // Negative direction
            for (let step = 1; step < 5; step++) {
                const r = row - dr * step;
                const c = col - dc * step;
                if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || next[r][c].mark !== placedMark) break;
                count++;
            }

            if (count >= 5) {
                for (let step = -4; step <= 4; step++) {
                    const r = row + dr * step;
                    const c = col + dc * step;
                    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) continue;
                    if (next[r][c].mark === placedMark) {
                        next[r][c] = { mark: next[r][c].mark, latest: true };
                    }
                }
                return [next, true];
            }
        }

        return [next, false];
    };

    const handleCellClick = useCallback(async (row: number, col: number) => {
        if (gameOver || board[row][col].mark !== null) {
            return;
        }

        // In online mode, only allow moves on player's turn
        if (state.gameMode === GameMode.OnlineMultiplayer) {
            const isMyTurn = (turn.mark === "X" && (state.iAmX ?? true)) ||
                (turn.mark === "O" && !(state.iAmX ?? true));
            
            if (!isMyTurn) {
                return;
            }
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
            
            if (state.gameMode === GameMode.OnlineMultiplayer && connection) {
                await connection.invoke('MakeMove', row, col);
            }
            
            return;
        }

        // Handle different game modes
        if (state.gameMode === GameMode.SinglePlayer) {
            setTurn({ mark: "O", latest: true });
        } else if (state.gameMode === GameMode.OnlineMultiplayer) {
            // Send move to opponent
            if (connection) {
                await connection.invoke('MakeMove', row, col);
            }
            setTurn(t => (t.mark === "X" ? { mark: "O", latest: true } : { mark: "X", latest: true }));
        } else {
            setTurn(t => (t.mark === "X" ? { mark: "O", latest: true } : { mark: "X", latest: true }));
        }
        
        // if (turn.mark === "O") {
        setTurnCount(count => count + 1);
        // }
    }, [turn, board, state.gameMode, state.opponentUsername, connection, gameOver]);

    const handleAIMove = useCallback(() => {
        if (state.gameMode !== GameMode.SinglePlayer) {
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

    const handleOnlineOpponentMove = useCallback(async (row: number, col: number) => {
        let next = board.map((r) => r.map(c => ({ mark: c.mark, latest: false })));
        next[row][col] = { mark: turn.mark , latest: true };

        let victory = false;
        [next, victory] = checkForVictory(next, row, col);

        setBoard(next);

        if (victory) {
            setError(`Player ${turn.mark} wins!`);
            setGameOver(true);
            return;
        }

        setTurn(t => (t.mark === "X" ? { mark: "O", latest: true } : { mark: "X", latest: true }));
        setTurnCount(count => count + 1);
    }, [board, turn]);
    
    useEffect(() => {
        if (state.gameMode === GameMode.SinglePlayer && turn.mark === "O") {
            handleAIMove();
        }
    }, [turn, state.gameMode, handleAIMove]);

    useEffect(() => {
        if (state.gameMode !== GameMode.OnlineMultiplayer) return;

        const newConnection = new HubConnectionBuilder()
            .withUrl('/gameHub')
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        const opponentMark = (state.iAmX ?? true) ? "O" : "X";

        newConnection
            .start()
            .then(() => {
                // ✅ use functional state updates to avoid stale board
                newConnection.on('OpponentMove', (row: number, col: number) => {
                    let victory = false;
                    
                    setBoard(prev => {
                        let next = prev.map(r => r.map(c => ({ mark: c.mark, latest: false })));
                        next[row][col] = { mark: opponentMark, latest: true };

                        [next, victory] = checkForVictory(next, row, col);

                        if (victory) {
                            setError(`Player ${opponentMark} wins!`);
                            setGameOver(true);
                        }

                        return next;
                    });

                    if (victory) {
                        return;
                    }
                    
                    setTurn(t => (t.mark === "X" ? { mark: "O", latest: true } : { mark: "X", latest: true }));
                    setTurnCount(c => c + 1);
                });

                newConnection.on('OpponentQuit', () => {
                    setError("Opponent has left the game");
                    setGameOver(true);
                });
            })
            .catch(err => setError("Connection failed: " + err));

        return () => {
            // clean up on unmount
            newConnection.off('OpponentMove');
            newConnection.off('OpponentQuit');

            if (newConnection.state === 'Connected') {
                newConnection.invoke('OpponentQuit').finally(() => newConnection.stop());
            } else {
                newConnection.stop();
            }
        };
    }, [state.gameMode, state.iAmX]);

    
    const handleReset = () => {
        setBoard(createEmpty());
        setTurn({mark: "X", latest: true});
        setGameOver(false);
        setTurnCount(1);
    };

    const handleQuit = useCallback(() => {
        if (state.gameMode === GameMode.OnlineMultiplayer && connection) {
            connection.invoke('OpponentQuit')
                .then(() => connection.stop())
                .finally(() => navigate("/app/online"));
        } else {
            navigate("/app");
        }
    }, [connection, state.gameMode, navigate]);

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
                                <strong>Turn {Math.ceil(turnCount / 2)}:</strong> {turn.mark}
                            </Typography>
                            <Typography
                                sx={{
                                    padding: "2px",
                                }}
                            >
                                <strong>Time elapsed:</strong> {gameTime}
                            </Typography>
                        </Box>
                        <Box sx={{ flexGrow: 4 }}>
                            {state.gameMode === GameMode.OnlineMultiplayer && (
                                <Typography sx={{ padding: "2px" }}>
                                    <strong>Opponent:</strong> {state.opponentUsername}
                                </Typography>
                            )}
                        </Box>
                        <Button onClick={handleReset} color="inherit" disabled={state.gameMode === GameMode.OnlineMultiplayer}>
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
