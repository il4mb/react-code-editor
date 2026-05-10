import { styled } from "@mui/system";
import { WidgetComponent } from "../types";
import { useState, useRef, useEffect } from "react";
import { useEditor } from "../Editor";
import { WidgetPortal } from "../cores";

const UnitBadge = styled("span")({
    display: "inline-flex",
    alignItems: "center",
    padding: "0 2px",
    backgroundColor: "rgba(79, 193, 255, 0.1)",
    border: "1px solid rgba(79, 193, 255, 0.2)",
    borderRadius: "3px",
    fontSize: "10px",
    color: "#4fc1ff",
    cursor: "pointer",
    marginLeft: "1px",
    userSelect: "none",
    verticalAlign: "middle",
    "&:hover": {
        backgroundColor: "rgba(79, 193, 255, 0.2)",
        borderColor: "rgba(79, 193, 255, 0.4)",
    },
});

const UnitDropdown = styled("div")({
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    zIndex: 3000,
    padding: "4px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "2px",
    minWidth: "120px",
    pointerEvents: "fill"
});

const UnitOption = styled("div")({
    padding: "4px 8px",
    fontSize: "11px",
    color: "#ccc",
    cursor: "pointer",
    borderRadius: "4px",
    textAlign: "center",
    "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "#fff",
    },
    "&.active": {
        backgroundColor: "#094771",
        color: "#fff",
    },
});

const UNITS = ["px", "rem", "em", "%", "vh", "vw", "pt", "pc", "vmin", "vmax", "ch", "ex"];

export const UnitWidget: WidgetComponent = ({ children, token }: any) => {
    const { dispatch, state } = useEditor();
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const badgeRef = useRef<HTMLSpanElement>(null);

    const currentUnit = token.text;

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (open) {
            setOpen(false);
            dispatch({ type: "SET_ACTIVE_TOKEN", payload: null });
        } else {
            const rect = badgeRef.current?.getBoundingClientRect();
            if (rect) {
                setCoords({ x: rect.left, y: rect.bottom + 4 });
            }
            setOpen(true);
            dispatch({ type: "SET_ACTIVE_TOKEN", payload: token.id });
        }
    };

    const selectUnit = (unit: string) => {
        dispatch({
            type: "SET_TOKEN_TEXT",
            payload: { tokenId: token.id, newText: unit }
        });
        setOpen(false);
        dispatch({ type: "SET_ACTIVE_TOKEN", payload: null });
    };

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = () => {
            setOpen(false);
            dispatch({ type: "SET_ACTIVE_TOKEN", payload: null });
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, [open, dispatch]);

    return (
        <>
            {children}
            <UnitBadge ref={badgeRef} onClick={toggleDropdown} data-ignore="true">
                ▾
            </UnitBadge>
            <WidgetPortal anchor={badgeRef} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
                {open && (
                    <UnitDropdown onClick={(e) => e.stopPropagation()}>
                        {UNITS.map(u => (
                            <UnitOption
                                key={u}
                                className={u === currentUnit ? "active" : ""}
                                onClick={() => selectUnit(u)}>
                                {u}
                            </UnitOption>
                        ))}
                    </UnitDropdown>
                )}
            </WidgetPortal>
        </>
    );
};

UnitWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        // Match units that follow a number
        const regex = /(?<=\d)(px|rem|em|%|vh|vw|pt|pc|vmin|vmax|ch|ex)\b/gi;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};
