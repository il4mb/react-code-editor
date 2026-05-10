import { WidgetComponent, WidgetComponentProps } from "../../types";
import { styled } from "@mui/system";
import { useEffect, useRef } from "react";
import { useEditor } from "../../Editor";
import { getTokenId } from "../../utils/tokenizer";

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

export const JSNumberWidget: WidgetComponent = ({ children, token, onChange }: WidgetComponentProps) => {
    const { dispatch } = useEditor();
    const isDragging = useRef(false);
    const initialX = useRef(0);
    const initialVal = useRef(0);
    const initialUnit = useRef("");

    // Use refs to avoid stale closures in document event listeners
    const onChangeRef = useRef(onChange);
    const tokenRef = useRef(token);
    
    // Update refs in every render
    onChangeRef.current = onChange;
    tokenRef.current = token;

    // Cleanup listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (isDragging.current) {
                document.body.style.cursor = "";
            }
        };
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
        const text = tokenRef.current?.text || "";
        // Match the numeric part and the unit part separately
        const numMatch = text.match(/^([-+]?\d*\.?\d+)(.*)$/);
        if (!numMatch) return;

        isDragging.current = true;
        initialX.current = e.clientX;
        initialVal.current = parseFloat(numMatch[1]) || 0;
        initialUnit.current = numMatch[2] || "";
        
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "ew-resize";
        dispatch({ type: "SET_ACTIVE_TOKEN", payload: getTokenId(tokenRef.current!) });
        e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !tokenRef.current) return;
        
        // Calculate total displacement from the start
        const totalDelta = e.clientX - initialX.current;
        const currentText = tokenRef.current.text || "";
        
        // Calculate next value relative to initial value
        let next = initialVal.current + totalDelta;
        
        // Format based on initial type
        if (!currentText.includes(".")) {
            next = Math.round(next);
        } else {
            next = parseFloat(next.toFixed(2));
        }

        // Strictly prevent newlines or accidental character additions
        const nextText = (next.toString() + initialUnit.current).replace(/[\r\n]/g, "");
        if (nextText !== currentText) {
            onChangeRef.current(nextText);
        }
    };

    const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        dispatch({ type: "SET_ACTIVE_TOKEN", payload: null });
    };

    return (
        <>
            <NumberBadge
                onMouseDown={onMouseDown}
                contentEditable={false}
                data-ignore="true">
                ⬌
            </NumberBadge>
            {children}
        </>
    );
}

JSNumberWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        // Match numbers and any following units (word characters or %) as a single token
        // Ignore hex colors preceded by '#'
        const regex = /(?<!#)-?\b\d+(\.\d+)?\w*%?/gi;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};
