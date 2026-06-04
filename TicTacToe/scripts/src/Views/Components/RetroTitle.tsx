import React from "react";
import { Box } from "@mui/material";

type RetroTitleProps = {
    fontSize?: number | string;
    align?: "left" | "center" | "right";
};

// Neon "TIC TAC TOE" logo: Press Start 2P with layered cyan/magenta glow.
const RetroTitle = ({ fontSize = "28px", align = "center" }: RetroTitleProps) => (
    <Box
        component="h1"
        sx={{
            m: 0,
            fontFamily: '"Press Start 2P", monospace',
            fontWeight: 400,
            fontSize,
            lineHeight: 1.4,
            textAlign: align,
            color: "#05d9e8",
            letterSpacing: "0.04em",
            textShadow: `
                0 0 6px rgba(5, 217, 232, 0.9),
                0 0 14px rgba(5, 217, 232, 0.6),
                3px 3px 0 rgba(255, 42, 109, 0.85)`,
        }}
    >
        Tic&nbsp;Tac&nbsp;Toe
    </Box>
);

export default RetroTitle;
