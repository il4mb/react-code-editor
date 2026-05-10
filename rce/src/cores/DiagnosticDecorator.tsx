import { styled } from "@mui/system";
import { ComponentType, HTMLAttributes } from "react";

type DiagnosticDecoratorProps = HTMLAttributes<HTMLSpanElement> & {
    severity?: 'error' | 'warning' | 'info'
}

export const DiagnosticDecorator: ComponentType<DiagnosticDecoratorProps> = styled("span", {
    shouldForwardProp: (prop) => prop !== "severity",
})<{ severity?: 'error' | 'warning' | 'info' }>(({ severity }) => ({
    textDecoration: "underline",
    textDecorationStyle: "wavy",
    textDecorationColor: severity === 'error' ? "#ff4d4d" : severity === 'warning' ? "#ffa500" : "#3399ff",
    cursor: "help",
    position: "relative",
    "&:hover::after": {
        content: "attr(data-message)",
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#333",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        whiteSpace: "pre",
        zIndex: 1000,
        pointerEvents: "none",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        marginBottom: "4px"
    }
}));
