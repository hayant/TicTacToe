import React from "react";
import MainView from "./MainView";
import {BrowserRouter, Route, Routes} from "react-router";
import GameView from "../GameView/GameView";
import LoginForm from "../Login/LoginForm";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginForm />} />
                <Route path="/app" element={<MainView />} />
                <Route path="/app/game" element={<GameView />} />
                <Route path="*" element={<h2>Not found</h2>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;