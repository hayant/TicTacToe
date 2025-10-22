import React, {useEffect, useRef, useState} from "react";
import "./Styles/MainView.css";
import GameView from "../GameView/GameView";
import {Navigate, redirect, useNavigate} from "react-router-dom";
import {HttpHelpers} from "../Helpers/HttpHelpers";

const MainView: React.FC = () => {
    const ref = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        HttpHelpers.makeRequest("api/Login/logout", "POST").then(result => {
            navigate("/");
        })
        
        // fetch("api/Login/logout", {
        //     method: "POST",
        //     credentials: "include", // TODO: same-origin?
        //     headers: { "Content-Type": "application/json" }
        // }).then(result => {
        //     window.location.href = "/";
        // }) // window.location.href = "/")
    }
    
    const handleGameStart = () => {
        navigate("/app/game");
    }
    
    return (
        <div className="MainView">
            <button
                className="MainView__button"
                type="button"
                onClick={handleGameStart}
            >Start</button>
            <button
                className="MainView__button"
                type="button"
                onClick={handleLogout}
            >Logout</button>
        </div>
    )
}

export default MainView;