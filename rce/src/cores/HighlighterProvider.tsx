import { useEffect, useRef } from "react";
import { useEditor } from "../Editor";
import { Token, WidgetComponent } from "../type";

interface HighlighterProviderProps {
    children: React.ReactNode;
    tokenizer?: (code: string) => { range: [number, number], color?: string, className?: string }[];
}

export default function HighlighterProvider({ children, tokenizer }: HighlighterProviderProps) {
    const { state, dispatch } = useEditor();
    const lastCodeRef = useRef("");

    useEffect(() => {
        if (!tokenizer || state.code === lastCodeRef.current) return;
        lastCodeRef.current = state.code;

        const highlights = tokenizer(state.code);
        
        // Map highlights to tokens
        const tokens: Token[] = highlights.map(h => ({
            range: h.range,
            component: createSyntaxComponent(h.color, h.className)
        }));

        // We need to merge these with existing widget tokens?
        // Actually, the current system might overwrite them if we dispatch SET_TOKENS.
        // Wait! SET_TOKENS is dispatched by useEditorHandler based on widgets.
        
        // Maybe we should add a SET_HIGHLIGHTS action to the state and merge them in Canvas.tsx.
    }, [state.code, tokenizer, dispatch]);

    return <>{children}</>;
}

function createSyntaxComponent(color?: string, className?: string): WidgetComponent {
    const Component = ({ children }: { children: React.ReactNode }) => (
        <span style={{ color }} className={className}>{children}</span>
    );
    return Component;
}
