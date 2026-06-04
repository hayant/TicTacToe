import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {HttpHelpers} from "./HttpHelpers";
import {AuthenticationResponseModel} from "../Data/DataObjects";

export class Authorization {
    static checkAuthentication = (setUser: React.Dispatch<React.SetStateAction<string>> | undefined = undefined) => {
        const navigate = useNavigate();

        useEffect(() => {
            HttpHelpers.makeRequest<AuthenticationResponseModel>(`/api/Login/me`, "POST", (new Date()).toDateString())
                .then(response => {
                    if (setUser && response.isAuthenticated) {
                        setUser(response.username!);
                    }})
                .catch(error => console.log(error));
        }, []);
    }
}