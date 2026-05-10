import { WidgetComponentProps } from "../../type";
import { styled } from "@mui/system";
import { useRef, useState } from "react";

const NumberBadge = styled("span")({
    display: "inline-flex",
    padding: "0 4px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "3px",
    fontSize: "10px",
    color: "#4fc1ff",
    cursor: "ew-resize",
    marginLeft: "4px",
    userSelect: "none",
    verticalAlign: "middle",
    "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
});

export function JSNumberWidget({ token, onChange }: WidgetComponentProps) {
    const isDragging = useRef(false);
    const lastX = useRef(0);
    const [val, setVal] = useState(parseFloat(token.text));

    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastX.current = e.clientX;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = e.clientX - lastX.current;
        lastX.current = e.clientX;
        
        setVal(prev => {
            const next = prev + delta;
            onChange(next.toString());
            return next;
        });
    };

    const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };

    return (
        <NumberBadge onMouseDown={onMouseDown}>
            ⬌
        </NumberBadge>
    );
}

JSNumberWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        const regex = /\b\d+(\.\d+)?\b/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};

