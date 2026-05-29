import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { HttpHelpers } from "../Helpers/HttpHelpers";
import { AuthenticationResponseModel } from "../Data/DataObjects";

type AuthState = "checking" | "authed" | "anon";

// Client-side route guard. The real security boundary is the backend
// (cookie auth + [Authorize] endpoints + /gameHub); this only controls
// which views are rendered so the app is not shown before login.
const RequireAuth = () => {
    const [state, setState] = useState<AuthState>("checking");

    useEffect(() => {
        HttpHelpers.makeRequest<AuthenticationResponseModel>(
            "/api/Login/me", "POST", (new Date()).toDateString())
            .then(res => setState(res.isAuthenticated ? "authed" : "anon"))
            .catch(() => setState("anon")); // /me returns 401 when not logged in
    }, []);

    if (state === "checking") return null;            // could render a spinner here
    if (state === "anon") return <Navigate to="/" replace />;
    return <Outlet />;
};

export default RequireAuth;
