import React, {useEffect, useRef, useState} from "react";
import "./Styles/MainView.css";
import GameView from "../GameView/GameView";

const MainView: React.FC = () => {
    const [gameStarted, setGameStarted] = useState(false);
    
    const ref = useRef(null);
    
    const handleLogout = () => {
        fetch("api/Login/logout", {
            method: "POST",
            credentials: "include", // TODO: same-origin?
            headers: { "Content-Type": "application/json" }
        }).then(result => {
            window.location.href = "/";
        }) // window.location.href = "/")
    }
    
    return (
        !gameStarted ? (
            <div className="MainView">
                <button
                    className="MainView__button"
                    type="button"
                    onClick={() => setGameStarted(true)}
                >Start</button>
                <button
                    className="MainView__button"
                    type="button"
                    onClick={handleLogout}
                >Logout</button>
            </div>
        ) : (
            <GameView />
        )
    )
}

export default MainView;