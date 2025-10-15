import React from "react";
import "./Styles/LoginForm.css";

const LoginForm: React.FC = () => {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    
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
            username: username,
            password: password,
        }
        
        
    }
    
    return (
        <div className="LoginForm">
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
            <button type="submit" onClick={handleSubmit}>Login</button>
        </div>);
};

interface ILoginData {
    username: string;
    password: string;
}

export default LoginForm;