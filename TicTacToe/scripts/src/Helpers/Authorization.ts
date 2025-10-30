import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {HttpHelpers} from "./HttpHelpers";

export class Authorization {
    static checkAuthentication = (setUser: React.Dispatch<React.SetStateAction<string>> | undefined = undefined) => {
        const navigate = useNavigate();

        useEffect(() => {
            HttpHelpers.makeRequest(`/api/Login/me`, "POST", (new Date()).toDateString()).then(response => {
                if (!response.ok) {
                    navigate("/");
                }
                if (setUser) {
                    response.json().then(json => setUser(json["username"]));
                }
            });
        }, []);
    }
}