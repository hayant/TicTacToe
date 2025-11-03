import React, { useCallback } from "react";
import {HttpHelpers} from "../../Helpers/HttpHelpers";
import {Navigate} from "react-router";
import { Button, TextField, Box, Stack, Typography, Paper } from "@mui/material";
import {LoginModel} from "../../Data/DataObjects";

const LoginForm = () => {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [password2, setPassword2] = React.useState("");
    const [error, setError] = React.useState("");
    const [showLoginForm, setShowLoginForm] = React.useState(true);
    
    const handleSubmit = () => {
        if (username.length === 0) {
            setError("Username cannot be empty");
            return;
        }
        else if (password.length === 0) {
            setError("Password cannot be empty");
            return;
        }
        
        setError("");
        
        const loginData : LoginModel = {
            username: username,
            password: password,
        }
        
        HttpHelpers.makeRequest("api/Login/login", "POST", loginData)
            .then(() => window.location.href = "/app")
            .catch(err => setError(err.message));
    }

    const handleRegister = () => {
        if (username.length === 0) {
            setError("Username cannot be empty");
            return;
        }
        else if (password.length === 0 || password2.length === 0) {
            setError("Password cannot be empty");
            return;
        }
        else if (password !== password2) {
            setError("Passwords do not match");
            return;
        }
        
        setError("");

        const loginData : LoginModel= {
            username: username,
            password: password,
        };

        HttpHelpers.makeRequest("api/Login/register", "POST", loginData)
            .then(response => setShowLoginForm(true))
            .catch(err => setError(err.message));
    }
    
    const loginForm = () => {
        return (
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
                            Login
                        </Typography>
                        <Stack spacing={2}>
                            <TextField
                                label="Username"
                                variant="outlined"
                                type="username"
                                fullWidth
                                required
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <TextField
                                label="Password"
                                variant="outlined"
                                type="password"
                                fullWidth
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Typography
                                align="center" 
                                gutterBottom
                                sx={{
                                    minHeight: 40,
                                    width: "100%",
                                    fontSize: "80%",
                                    color: "#f00",
                                }}
                            >
                                {error}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleSubmit}
                            >
                                Log In
                            </Button>

                            <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={() => setShowLoginForm(false)}
                            >
                                Sign Up
                            </Button>
                        </Stack>
                    </Paper>
                </div>
            </Box>
        );
    }

    const registerForm = () => {
        return (
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
                            Sign Up
                        </Typography>

                        <Stack spacing={2}>
                            <TextField
                                label="Username"
                                variant="outlined"
                                type="username"
                                fullWidth
                                required
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <TextField
                                label="Password"
                                variant="outlined"
                                type="password"
                                fullWidth
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <TextField
                                label="Re-enter password"
                                variant="outlined"
                                type="password"
                                fullWidth
                                required
                                onChange={(e) => setPassword2(e.target.value)}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleRegister}
                            >
                                Sign Up
                            </Button>

                            <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={() => setShowLoginForm(true)}
                            >
                                Back to Login
                            </Button>
                        </Stack>
                    </Paper>
                </div>
            </Box>
        );
    }
    
    return showLoginForm ? (loginForm()) : (registerForm());
};

export default LoginForm;