import {useNavigate} from "react-router";
import {useEffect, useRef} from "react";
import {HttpHelpers} from "./HttpHelpers";

export class Authorization {
    static checkAuthentication = () => {
        const navigate = useNavigate();

        useEffect(() => {
            HttpHelpers.makeRequest("api/Login/me", "GET").then(response => {
                if (!response.ok) {
                    navigate("/");
                }
            });
        }, []);
    }
}