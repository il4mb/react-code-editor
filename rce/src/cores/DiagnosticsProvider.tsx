import { useEffect } from "react";
import { useEditor } from "../Editor";
import { Diagnostic } from "../type";

interface DiagnosticsProviderProps {
    children: React.ReactNode;
    validator?: (code: string) => Diagnostic[];
}

export default function DiagnosticsProvider({ children, validator }: DiagnosticsProviderProps) {
    const { state, dispatch } = useEditor();

    useEffect(() => {
        if (!validator) {
            if (state.diagnostics.length > 0) {
                dispatch({ type: "SET_DIAGNOSTICS", payload: [] });
            }
            return;
        }

        const diagnostics = validator(state.code);
        // Simple comparison to avoid re-render loops if validator is not memoized
        const isSame = diagnostics.length === state.diagnostics.length &&
            diagnostics.every((d, i) =>
                d.range[0] === state.diagnostics[i].range[0] &&
                d.range[1] === state.diagnostics[i].range[1] &&
                d.message === state.diagnostics[i].message &&
                d.severity === state.diagnostics[i].severity
            );

        if (!isSame) {
            dispatch({ type: "SET_DIAGNOSTICS", payload: diagnostics });
        }
    }, [state.code, validator, dispatch, state.diagnostics]);

    return <>{children}</>;
}
