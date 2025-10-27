import React, {useEffect, useRef, useState} from "react";
import "./Styles/MainView.css";
import GameView from "../GameView/GameView";
import {Navigate, redirect, useNavigate} from "react-router";
import {HttpHelpers} from "../Helpers/HttpHelpers";
import {Authorization} from "../Helpers/Authorization";

function MainView(){
    const navigate = useNavigate();
    const ref = useRef(null);

    Authorization.checkAuthentication();
    
    const handleLogout = () => {
        HttpHelpers.makeRequest("api/Login/logout", "POST").then(result => {
            navigate("/");
        })
    }
    
    const handleGameStart = () => {
        navigate("/app/game");
    }
    
    return (
        <div className="MainView" ref={ref}>
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