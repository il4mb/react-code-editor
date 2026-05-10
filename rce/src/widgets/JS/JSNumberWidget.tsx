import { WidgetComponent } from "../../types";
import { styled } from "@mui/system";
import { useEffect, useRef, useState } from "react";
import { useEditor } from "../../Editor";

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

export const JSNumberWidget: WidgetComponent = ({ children, token }) => {
    const { dispatch } = useEditor();
    
    const [dragging, setDragging] = useState(false);
    const [localValue, setLocalValue] = useState("");
    
    const initialX = useRef(0);
    const initialVal = useRef(0);
    const initialUnit = useRef("");
    const isDraggingRef = useRef(false);
    const localValueRef = useRef("");

    const tokenRef = useRef(token);
    tokenRef.current = token;

    const handleMouseDown = (e: React.MouseEvent) => {
        const text = tokenRef.current?.text || "";
        const numMatch = text.match(/^([-+]?\d*\.?\d+)(.*)$/);
        if (!numMatch) return;

        initialX.current = e.clientX;
        initialVal.current = parseFloat(numMatch[1]) || 0;
        initialUnit.current = numMatch[2] || "";

        isDraggingRef.current = true;
        setDragging(true);
        setLocalValue(text);
        localValueRef.current = text;

        const onMove = (me: MouseEvent) => {
            const totalDelta = me.clientX - initialX.current;
            let next = initialVal.current + totalDelta;
            
            if (!tokenRef.current.text.includes(".")) {
                next = Math.round(next);
            } else {
                next = parseFloat(next.toFixed(2));
            }

            const nextText = (next.toString() + initialUnit.current).replace(/[\r\n]/g, "");
            
            // Update local state for the widget display
            setLocalValue(nextText);
            localValueRef.current = nextText;

            // REAL-TIME: Dispatch to global state
            dispatch({
                type: "SET_TOKEN_TEXT",
                payload: { tokenId: tokenRef.current.id, newText: nextText }
            });
        };

        const onUp = () => {
            isDraggingRef.current = false;
            setDragging(false);
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.body.style.cursor = "";
            
            dispatch({
                type: "SET_TOKEN_TEXT",
                payload: { tokenId: tokenRef.current.id, newText: localValueRef.current }
            });
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        document.body.style.cursor = "ew-resize";
        e.preventDefault();
    };

    return (
        <>
            <NumberBadge
                onMouseDown={handleMouseDown}
                contentEditable={false}
                data-ignore="true">
                ⬌
            </NumberBadge>
            {dragging ? localValue : children}
        </>
    );
}

JSNumberWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        const regex = /(?<!#)-?\b\d+(\.\d+)?\w*%?/gi;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};
