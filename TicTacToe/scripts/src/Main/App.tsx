import React, {useEffect, useRef, useState} from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import MainView from "./MainView";
// import Spinner from "./Spinner";

function App() {
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // const ref = useRef(null);
    
    useEffect(() => {
        // Call backend to verify session cookie
        fetch("/api/Login/me", { credentials: "include" })
            .then(res => {
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            })
            .catch(() => setIsAuthenticated(false))
            .finally(() => setAuthChecked(true));
    }, []);

    if (!authChecked) {
        return "Loading...";
    }

    return (
        isAuthenticated ? (
            // <CSSTransition
            //     in={true}
            //     nodeRef={ref}
            //     timeout={1000}
            //     classNames="fade-slide"
            //     unmountOnExit={true}
            // >
                <div>
                    <MainView />
                </div>
            // </CSSTransition>
        ) : (
            window.location.href = "/login"
        )
    );
}

export default App;