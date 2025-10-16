import React, {useEffect, useRef} from "react";
import App from "./App";
import { CSSTransition } from "react-transition-group";

// import "./Styles/LoginForm.css";

const MainView: React.FC = () => {
    const [showButton, setShowButton] = React.useState(false);
    
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

    useEffect(() => {
        setShowButton(true);
    }, []);
    
    return (
        <CSSTransition
            in={showButton}
            nodeRef={ref}
            timeout={1000}
            classNames="logout"
            unmountOnExit
            // onEnter={() => setShowButton(false)}
            // onExited={() => setShowButton(true)}
        >
            <div>
                <button type="button" onClick={handleLogout}>Logout</button>
            </div>
        </CSSTransition>
    )
}

export default MainView;