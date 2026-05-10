import { WidgetComponentProps } from "../../types";
import { styled } from "@mui/system";
import { useEffect, useRef, useState } from "react";

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

export function JSNumberWidget({ children, token, onChange }: WidgetComponentProps) {
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
        const numMatch = text.match(/^(-?\d*\.?\d+)(.*)$/);
        if (!numMatch) return;

        isDragging.current = true;
        initialX.current = e.clientX;
        initialVal.current = parseFloat(numMatch[1]) || 0;
        initialUnit.current = numMatch[2] || "";

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "ew-resize";
        e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !tokenRef.current) return;

        // Calculate total displacement from the start
        const totalDelta = e.clientX - initialX.current;
        const currentText = tokenRef.current.text || "";

        let next = initialVal.current + totalDelta;

        // Format based on initial type
        if (!currentText.includes(".")) {
            next = Math.round(next);
        } else {
            next = parseFloat(next.toFixed(2));
        }

        // Only update if changed
        const nextText = next.toString();
        if (nextText !== currentText) {
            onChangeRef.current(nextText);
        }
    };

    const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
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
        // Match numbers ONLY (signs and decimals included)
        const regex = /-?\b\d+(\.\d+)?\b/gi;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};

