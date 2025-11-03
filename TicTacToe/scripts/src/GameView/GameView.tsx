import React, {useCallback, useState} from "react";
import Grid, { CellValue } from "../Grid/GameGrid";
import {Authorization} from "../Helpers/Authorization";
import {Container, AppBar, Box, Typography, Stack, Toolbar, Button} from "@mui/material"
import {useNavigate} from "react-router";

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
    
    const navigate = useNavigate();
    
    Authorization.checkAuthentication();

    const checkForVictory = (next: CellValue[][], row: number, col: number): CellValue[][] => {
        return next; // TODO
    }

    const handleCellClick = useCallback((row: number, col: number) => {
        setBoard((prev) => {
            if (prev[row][col].mark !== null) {
                return prev;
            }
            
            let next = prev.map((r) => r.map(c => ({ mark: c.mark, latest: false })));
            next[row][col] = { mark: turn.mark, latest: true };
            setTurn((t) => (t.mark === "X" ? {mark: "O", latest: true} : {mark: "X", latest: true}));
            if (turn.mark === "O") {
                setTurnCount((count) => count + 1);
            }
            
            // next = checkForVictory(next, row, col);
            return next;
        });
    }, [turn]);

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
            </Stack>
        </Container>
    );
}
