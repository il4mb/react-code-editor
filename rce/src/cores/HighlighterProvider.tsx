import { useEffect, useRef } from "react";
import { useEditor } from "../Editor";
import { Highlight } from "../types";

interface HighlighterProviderProps {
    children: React.ReactNode;
    highlighter?: (code: string) => Highlight[];
}

export default function HighlighterProvider({ children, highlighter }: HighlighterProviderProps) {
    const { state, dispatch } = useEditor();
    const lastCodeRef = useRef("");
    const lastHighlightsRef = useRef<Highlight[]>([]);

    useEffect(() => {
        if (!highlighter) {
            if (lastHighlightsRef.current.length > 0) {
                lastHighlightsRef.current = [];
                dispatch({ type: "SET_HIGHLIGHTS", payload: [] });
            }
            return;
        }

        if (state.code === lastCodeRef.current) return;
        lastCodeRef.current = state.code;

        const highlights = highlighter(state.code);
        
        // Simple comparison to avoid re-render loops
        const isSame = highlights.length === lastHighlightsRef.current.length &&
            highlights.every((h, i) => {
                const prev = lastHighlightsRef.current[i];
                return h.range[0] === prev.range[0] &&
                       h.range[1] === prev.range[1] &&
                       h.color === prev.color &&
                       h.className === prev.className;
            });

        if (!isSame) {
            lastHighlightsRef.current = highlights;
            dispatch({ type: "SET_HIGHLIGHTS", payload: highlights });
        }
    }, [state.code, highlighter, dispatch]);

    return <>{children}</>;
}

/** Utility to create a regex-based highlighter */
export function createRegexHighlighter(rules: { regex: RegExp, color?: string, className?: string }[]) {
    return (code: string): Highlight[] => {
        const highlights: Highlight[] = [];
        for (const rule of rules) {
            let match;
            const regex = new RegExp(rule.regex, rule.regex.flags.includes('g') ? rule.regex.flags : rule.regex.flags + 'g');
            while ((match = regex.exec(code)) !== null) {
                highlights.push({
                    range: [match.index, match.index + match[0].length],
                    color: rule.color,
                    className: rule.className
                });
            }
        }
        return highlights;
    };
}
