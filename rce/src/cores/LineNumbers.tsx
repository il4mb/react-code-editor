import { useEditor } from "../Editor";
import { styled } from "@mui/system";
import { useMemo } from "react";

const LineNumbersContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    padding: "20px 12px 20px 0",
    backgroundColor: "#1e1e1e",
    color: "#858585",
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: "13px",
    lineHeight: 1.7,
    userSelect: "none",
    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
    minWidth: "40px",
});

const LineNumber = styled("div", {
    shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active }) => ({
    height: "22.1px", // Matches 13px * 1.7 lineHeight
    color: active ? "#c6c6c6" : "inherit",
    fontWeight: active ? "bold" : "normal",
}));

export default function LineNumbers() {
    const { state } = useEditor();
    const { code, position } = state;

    const lineCount = useMemo(() => code.split("\n").length, [code]);
    const activeLine = useMemo(() => {
        if (position === null) return -1;
        return code.slice(0, position).split("\n").length - 1;
    }, [code, position]);

    const lines = Array.from({ length: lineCount }, (_, i) => i);

    return (
        <LineNumbersContainer>
            {lines.map((i) => (
                <LineNumber key={i} active={i === activeLine}>
                    {i + 1}
                </LineNumber>
            ))}
        </LineNumbersContainer>
    );
}
