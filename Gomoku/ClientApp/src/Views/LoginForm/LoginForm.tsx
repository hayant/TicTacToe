import React, { useCallback } from "react";
import {HttpHelpers} from "../../Helpers/HttpHelpers";
import {useNavigate} from "react-router";
import { Button, TextField, Box, Stack, Typography, Paper } from "@mui/material";
import {LoginModel} from "../../Data/DataObjects";
import RetroTitle from "../Components/RetroTitle";

const LoginForm = () => {
    const navigate = useNavigate();
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [password2, setPassword2] = React.useState("");
    const [error, setError] = React.useState("");
    const [showLoginForm, setShowLoginForm] = React.useState(true);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

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
            .then(() => navigate("/app"))
            .catch(err => setError(err.message));
    }

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();

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
    
    const toggleForm = (showLogin: boolean) => {
        setError("");
        setShowLoginForm(showLogin);
    }

    const versionFooter = (
        <Typography
            variant="caption"
            align="center"
            display="block"
            sx={{ mt: 2, color: "text.secondary" }}
        >
            {__APP_VERSION__}
        </Typography>
    );

    const loginForm = () => {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
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
                        <RetroTitle fontSize="26px" />
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
                        <form onSubmit={handleSubmit} noValidate>
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
                                    color: "error.main",
                                }}
                            >
                                {error}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                            >
                                Log In
                            </Button>

                            <Button
                                type="button"
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={() => toggleForm(false)}
                            >
                                Sign Up
                            </Button>
                        </Stack>
                        </form>
                    </Paper>
                    {versionFooter}
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
                        <RetroTitle fontSize="26px" />
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

                        <form onSubmit={handleRegister} noValidate>
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
                            <Typography
                                align="center"
                                gutterBottom
                                sx={{
                                    minHeight: 40,
                                    width: "100%",
                                    fontSize: "80%",
                                    color: "error.main",
                                }}
                            >
                                {error}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                            >
                                Sign Up
                            </Button>

                            <Button
                                type="button"
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={() => toggleForm(true)}
                            >
                                Back to Login
                            </Button>
                        </Stack>
                        </form>
                    </Paper>
                    {versionFooter}
                </div>
            </Box>
        );
    }
    
    return showLoginForm ? (loginForm()) : (registerForm());
};

export default LoginForm;