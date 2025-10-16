import React, {useRef} from "react";
import "./Styles/LoginForm.css";
import {CSSTransition} from "react-transition-group";

const LoginForm: React.FC = () => {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    
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
        
        fetch("api/Login/login", { 
            method: "POST",
            body: JSON.stringify(loginData),
            credentials: "include", // TODO: same-origin?
            headers: { "Content-Type": "application/json" }
        }).then(response => response.ok
            ? window.location.href = "/app"
            : setError("Incorrect username or password"));
    }
    
    return (
        <CSSTransition
            in={true}
            nodeRef={ref}
            timeout={1000}
            classNames="fade-in"
            unmountOnExit={true}
        >
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
            <div className="LoginForm__error">{error}</div>
            <button type="button" onClick={handleSubmit}>Login</button>
            </div>
        </CSSTransition>);
};

interface ILoginData {
    Username: string;
    Password: string;
}

export default LoginForm;