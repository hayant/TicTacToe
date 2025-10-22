import React, {useEffect, useRef, useState} from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import MainView from "./MainView";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoginForm from "../Login/LoginForm";
import GameView from "../GameView/GameView";
// import Example from "./TransitionTest";
// import Spinner from "./Spinner";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginForm />} />
                {/*<Route path="/login" element={<LoginForm />} />*/}
                <Route path="/app" element={<MainView />} />
                <Route path="/app/game" element={<GameView />} />
                <Route path="*" element={<h2>Not found</h2>} />
            </Routes>
        </BrowserRouter>
    );
    // const [authChecked, setAuthChecked] = useState(false);
    // const [isAuthenticated, setIsAuthenticated] = useState(false);
    //
    // // const ref = useRef(null);
    //
    // useEffect(() => {
    //     // Call backend to verify session cookie
    //     fetch("/api/Login/me", { credentials: "include" })
    //         .then(res => {
    //             if (res.ok) {
    //                 setIsAuthenticated(true);
    //             } else {
    //                 setIsAuthenticated(false);
    //             }
    //         })
    //         .catch(() => setIsAuthenticated(false))
    //         .finally(() => setAuthChecked(true));
    // }, []);
    //
    // if (!authChecked) {
    //     return "Loading...";
    // }
    //
    // return (
    //     isAuthenticated ? (
    //         <div>
    //             <MainView />
    //         </div>
    //     ) : (
    //         window.location.href = "/login"
    //     )
    // );
}

export default App;