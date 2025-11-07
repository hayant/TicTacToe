import React, {useEffect, useRef, useState} from "react";
import GameView from "../GameView/GameView";
import {Navigate, redirect, useNavigate} from "react-router";
import {HttpHelpers} from "../../Helpers/HttpHelpers";
import {Authorization} from "../../Helpers/Authorization";
import {Box, Button, Paper, Stack, TextField, Typography, Slider, Container} from "@mui/material";

function MainMenu(){
    const [user, setUser] = useState<string>("");
    
    const navigate = useNavigate();

    Authorization.checkAuthentication(setUser);
    
    const handleQuit = () => {
        HttpHelpers.makeRequest("api/Login/logout", "POST").then(result => {
            navigate("/");
        })
    }
    
    const handleGameStart = (singlePlayer: boolean) => {
        navigate("/app/game", { state: { singlePlayer: singlePlayer } });
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
                                    defaultValue={3}
                                    getAriaValueText={value => value.toFixed(1)}
                                    valueLabelDisplay="auto"
                                    style={{ marginTop: "0px", marginBottom: "10px" }}
                                    step={1}
                                    marks
                                    min={1}
                                    max={10}
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
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    // onClick={continueGame}
                                    disabled
                                    style={{ marginBottom: "30px" }}
                                >
                                    Continue
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    // onClick={showHighscores}
                                >
                                    Highscores
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    onClick={handleQuit}
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
    
    return mainMenu();
}

export default MainMenu;