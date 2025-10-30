import React, {useCallback, useState} from "react";
import Grid, { CellValue } from "../Grid/Grid";
import {Authorization} from "../Helpers/Authorization";
import {Container, AppBar, Box, Typography, Stack, Toolbar, Button} from "@mui/material"
import {useNavigate} from "react-router";

const SIZE = 20;

function createEmpty(size = SIZE): CellValue[][] {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => null)
    );
}

export default function GameView() {
    const [board, setBoard] = useState<CellValue[][]>(() => createEmpty());
    const [turn, setTurn] = useState<CellValue>("X"); // X or O
    const [turnCount, setTurnCount] = useState(1);
    const [gameTime, setGameTime] = useState("00:00:00");
    const [timer, setTimer] = useState(0);
    
    const navigate = useNavigate();
    
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
            if (turn === "O") {
                setTurnCount((count) => count + 1);
            }
            return next;
        });
    }, [turn]);

    const handleReset = () => {
        setBoard(createEmpty());
        setTurn("X");
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
                                <strong>Turn {turnCount}:</strong> {turn}
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
                        {/*<Button color="inherit">Settings</Button>*/}
                        {/*<Button color="inherit">Reset</Button>*/}
                        {/*<Button color="inherit">Exit</Button>*/}
                    </Toolbar>
                </AppBar>
                <Grid size={SIZE} values={board} onCellClick={handleCellClick} />
            </Stack>
        </Container>
    );
}
