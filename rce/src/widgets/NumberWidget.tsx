import { styled } from "@mui/system"
import { WidgetComponent } from "../types"
import { useEffect, useRef, useState } from "react";
import { useEditor } from "../Editor";

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

export const NumberWidget: WidgetComponent = ({ children, token, renderDecorator }: any) => {
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
            
            setLocalValue(nextText);
            localValueRef.current = nextText;

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
            {renderDecorator && (
                <NumberBadge
                    onMouseDown={handleMouseDown}
                    contentEditable={false}
                    data-ignore="true">
                    ⬌
                </NumberBadge>
            )}
            {dragging ? localValue : children}
        </>
    );
}

NumberWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        
        // 1. Identify all color function blocks to exclude them
        const colorBlocks: [number, number][] = [];
        const colorRegex = /rgba?\s*\([^)]*\)|hsla?\s*\([^)]*\)/gi;
        let colorMatch;
        while ((colorMatch = colorRegex.exec(code)) !== null) {
            colorBlocks.push([colorMatch.index, colorMatch.index + colorMatch[0].length]);
        }

        // 2. Match numbers normally
        const numRegex = /(?<![#\w\(\,])-?\b\d+(\.\d+)?\w*%?/gi;
        let match;
        while ((match = numRegex.exec(code)) !== null) {
            const start = match.index;
            const end = match.index + match[0].length;

            // 3. Skip if this number is inside a color block
            const isInsideColor = colorBlocks.some(block => start >= block[0] && end <= block[1]);
            if (isInsideColor) continue;

            if (!match[0].includes("\n") && !match[0].includes("\r")) {
                ranges.push([start, end]);
            }
        }
        return ranges;
    }
};