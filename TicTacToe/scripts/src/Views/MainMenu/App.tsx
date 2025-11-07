import React from "react";
import MainMenu from "./MainMenu";
import {BrowserRouter, Route, Routes} from "react-router";
import GameView from "../GameView/GameView";
import LoginForm from "../LoginForm/LoginForm";
import OnlineLobbyView from "../OnlineLobby/OnlineLobbyView";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginForm />} />
                <Route path="/app" element={<MainMenu />} />
                <Route path="/app/game" element={<GameView />} />
                <Route path="/app/online" element={<OnlineLobbyView />} />
                <Route path="*" element={<h2>Not found</h2>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;