import { useMemo } from "react";
import { EditorState, Range } from "../type";

export function useBraceMatching(state: EditorState) {
    const { code, position } = state;

    return useMemo(() => {
        if (position === null) return null;

        const char = code[position];
        const prevChar = code[position - 1];
        
        // Find matching pair for char at or before cursor
        const pairs: Record<string, string> = {
            "{": "}", "[": "]", "(": ")",
            "}": "{", "]": "[", ")": "("
        };

        let targetPos = -1;
        let targetChar = "";
        
        if (pairs[char]) {
            targetPos = position;
            targetChar = char;
        } else if (pairs[prevChar]) {
            targetPos = position - 1;
            targetChar = prevChar;
        }

        if (targetPos === -1) return null;

        const matchingChar = pairs[targetChar];
        const isForward = "{[(".includes(targetChar);
        
        let depth = 0;
        if (isForward) {
            for (let i = targetPos; i < code.length; i++) {
                if (code[i] === targetChar) depth++;
                else if (code[i] === matchingChar) depth--;
                if (depth === 0) return [targetPos, i] as Range;
            }
        } else {
            for (let i = targetPos; i >= 0; i--) {
                if (code[i] === targetChar) depth++;
                else if (code[i] === matchingChar) depth--;
                if (depth === 0) return [i, targetPos] as Range;
            }
        }

        return null;
    }, [code, position]);
}
