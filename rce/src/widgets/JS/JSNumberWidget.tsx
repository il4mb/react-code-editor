import { WidgetComponent } from "../../types";
import { styled } from "@mui/system";
import { useRef, useState } from "react";
import { useWidgetDrag, useWidgetToken } from "../../hooks/widgetHooks";

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

export const JSNumberWidget: WidgetComponent = ({ children, token, renderDecorator }) => {
    const { tokenRef, setText } = useWidgetToken(token)
    
    const [dragging, setDragging] = useState(false);
    const [localValue, setLocalValue] = useState("");
    
    const initialVal = useRef(0);
    const initialUnit = useRef("");
    const localValueRef = useRef("");

    const { onMouseDown } = useWidgetDrag({
        cursor: "ew-resize",
        onStart: () => {
            const text = tokenRef.current?.text || "";
            const numMatch = text.match(/^([-+]?\d*\.?\d+)(.*)$/);
            if (!numMatch) return;

            initialVal.current = parseFloat(numMatch[1]) || 0;
            initialUnit.current = numMatch[2] || "";
            setDragging(true);
            setLocalValue(text);
            localValueRef.current = text;
        },
        onMove: ({ deltaX }) => {
            if (!dragging && !localValueRef.current) return
            let next = initialVal.current + deltaX;
            
            if (!tokenRef.current.text.includes(".")) {
                next = Math.round(next);
            } else {
                next = parseFloat(next.toFixed(2));
            }

            const nextText = next.toString() + initialUnit.current;
            setLocalValue(nextText);
            localValueRef.current = nextText;
            setText(nextText)
        },
        onEnd: () => {
            setDragging(false);
            if (localValueRef.current) {
                setText(localValueRef.current)
            }
        }
    })

    const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        const text = tokenRef.current?.text || "";
        const numMatch = text.match(/^([-+]?\d*\.?\d+)(.*)$/);
        if (!numMatch) return;

        onMouseDown(e)
    }

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

JSNumberWidget.widget = {
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

            ranges.push([start, end]);
        }
        return ranges;
    }
};
