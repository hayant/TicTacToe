import React, {useCallback, useRef} from "react";
import "./Styles/LoginForm.css";
import {CSSTransition} from "react-transition-group";
import {HttpHelpers} from "../Helpers/HttpHelpers";
import {Navigate} from "react-router-dom";

const LoginForm = () => {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [password2, setPassword2] = React.useState("");
    const [error, setError] = React.useState("");
    const [loginForm, setLoginForm] = React.useState(true);
    const [loadApp, setLoadApp] = React.useState(false);
    
    const ref = useRef(null);
    
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
        
        const loginData : ILoginData = {
            Username: username,
            Password: password,
        }
        
        HttpHelpers.makeRequest("api/Login/login", "POST", loginData)
            .then(response => {
                if (response.ok) {
                    window.location.href = "/app";
                } else {
                    response.json().then(json => setError(json["message"]));
                }
            });
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

        const loginData : ILoginData = {
            Username: username,
            Password: password,
        };

        HttpHelpers.makeRequest("api/Login/register", "POST", loginData)
            .then(response => {
                if (response.ok) {
                    // window.location.href = "/app";
                    setLoadApp(true);
                } else {
                    response.text().then(text => setError(text));
                }
            });   
    }

    useCallback(() => {
        if (loadApp) {
            return <Navigate to={"/app"}></Navigate>
        }
    }, [loadApp]);
    
    return (
        loginForm ?
                (<div className="LoginForm" ref={ref}>
                    <input
                        className="LoginForm__username"
                        type="username"
                        placeholder="Username"
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className="LoginForm__password"
                        type="password"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="LoginForm__error">{error}</div>
                    <button type="button" onClick={handleSubmit}>Login</button>
                    <button type="button" onClick={() => setLoginForm(false)}>Register</button>
                </div>) : (
                <div className="LoginForm" ref={ref}>
                    <input
                        className="LoginForm__username"
                        type="username"
                        placeholder="Username"
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className="LoginForm__password"
                        type="password"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        className="LoginForm__password"
                        type="password"
                        placeholder="Re-enter password"
                        onChange={(e) => setPassword2(e.target.value)}
                    />
                    <div className="LoginForm__error">{error}</div>
                    <button type="button" onClick={handleRegister}>Submit</button>
                    <button type="button" onClick={() => setLoginForm(true)}>Back</button>
                </div>   
            ));
};

interface ILoginData {
    Username: string;
    Password: string;
}

export default LoginForm;