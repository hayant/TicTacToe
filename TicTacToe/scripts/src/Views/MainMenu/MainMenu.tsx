import React, {useState, useEffect} from "react";
import {GameViewProps} from "../GameView/GameView";
import {useNavigate} from "react-router";
import {HttpHelpers} from "../../Helpers/HttpHelpers";
import {Authorization} from "../../Helpers/Authorization";
import {Box, Button, Container, Paper, Slider, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import {GameMode} from "../../Data/GameMode";
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

function MainMenu(){
    const [user, setUser] = useState<string>("");
    const [difficulty, setDifficulty] = useState<number>(3);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [unfinishedGame, setUnfinishedGame] = useState<{gameId: number, difficulty: number} | null>(null);
    const [connection, setConnection] = useState<HubConnection | null>(null);
    
    const navigate = useNavigate();

    Authorization.checkAuthentication(setUser);

    // Create SignalR connection for checking unfinished games
    useEffect(() => {
        const conn = new HubConnectionBuilder()
            .withUrl('/gameHub')
            .withAutomaticReconnect()
            .build();

        conn.start().catch(err => {
            console.error("SignalR connection error:", err);
        });

        setConnection(conn);

        return () => {
            conn.stop();
        };
    }, []);
    
    const handleQuit = () => {
        HttpHelpers.makeRequest("api/Login/logout", "POST").then(result => {
            navigate("/");
        })
    }
    
    const handleGameStart = async (singlePlayer: boolean) => {
        if (!singlePlayer) {
            // For local multiplayer, start immediately
            const gameViewProps: GameViewProps = {
                gameMode: GameMode.LocalMultiplayer,
                difficulty: undefined,
            }
            navigate("/app/game", { state: gameViewProps });
            return;
        }

        // For single player, check for unfinished game
        if (connection && connection.state === 'Connected') {
            try {
                const result = await connection.invoke<{gameId: number, difficulty: number} | null>('CheckUnfinishedGame');
                if (result) {
                    setUnfinishedGame(result);
                    setDialogOpen(true);
                    return;
                }
            } catch (error) {
                console.error("Failed to check for unfinished game:", error);
            }
        }

        // No unfinished game found, start new game
        startNewGame();
    }

    const startNewGame = () => {
        const gameViewProps: GameViewProps = {
            gameMode: GameMode.SinglePlayer,
            difficulty: difficulty,
        }
        navigate("/app/game", { state: gameViewProps });
    }

    const continueExistingGame = () => {
        if (unfinishedGame) {
            const gameViewProps: GameViewProps = {
                gameMode: GameMode.SinglePlayer,
                difficulty: unfinishedGame.difficulty,
                gameId: unfinishedGame.gameId,
            }
            navigate("/app/game", { state: gameViewProps });
        }
        setDialogOpen(false);
    }

    const handleDialogClose = () => {
        setDialogOpen(false);
        setUnfinishedGame(null);
    }

    const handleOnlineLobby = () => {
        navigate("/app/online");
    }
    
    const mainMenu = () => {
        return (
            <Container style={{ width: 400, alignContent: "center" }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "100vh",
                        backgroundColor: "#f5f5f5",
                    }}
                >
                    <div>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                width: "100%",
                                maxWidth: 400,
                                borderRadius: 3,
                            }}
                        >
                            <h1 style={{fontFamily: "fantasy", fontSize: "42px"}}>Tic Tac Toe</h1>
                            <Typography variant="h6" align="center" gutterBottom>
                                Welcome, {user}!
                            </Typography>
                        </Paper>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                width: "100%",
                                maxWidth: 400,
                                borderRadius: 3,
                            }}
                        >
                            <Typography variant="h5" align="center" gutterBottom>
                                Game menu
                            </Typography>
                            <Stack spacing={2}>
                                <Typography variant="h6" align="left" style={{marginTop: "20px"}}>
                                    Difficulty
                                </Typography>
                                <Slider
                                    aria-label="Difficulty"
                                    value={difficulty}
                                    onChange={(_, value) => setDifficulty(value as number)}
                                    getAriaValueText={value => value.toString()}
                                    valueLabelDisplay="auto"
                                    style={{ marginTop: "0px", marginBottom: "10px" }}
                                    step={1}
                                    marks
                                    min={1}
                                    max={5}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={() => handleGameStart(true)}
                                >
                                    1 Player
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={() => handleGameStart(false)}
                                >
                                    2 Player Local
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={handleOnlineLobby}
                                >
                                    Online Lobby
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    onClick={handleQuit}
                                    style={{marginTop: "30px"}}
                                >
                                    Quit
                                </Button>
                            </Stack>
                        </Paper>
                    </div>
                </Box>
            </Container>
        );
    }
    
    return (
        <>
            {mainMenu()}
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>Continue Game?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Start a new game or continue the existing game?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={startNewGame}>Start new</Button>
                    <Button onClick={continueExistingGame} variant="contained">Continue existing</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default MainMenu;