import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {HttpHelpers} from "./HttpHelpers";

export class Authorization {
    static checkAuthentication = (setUser: React.Dispatch<React.SetStateAction<string>>) => {
        const navigate = useNavigate();

        useEffect(() => {
            HttpHelpers.makeRequest("api/Login/me", "GET").then(response => {
                if (!response.ok) {
                    navigate("/");
                }
                response.json().then(json => setUser(json["username"]));
            });
        }, []);
    }
}