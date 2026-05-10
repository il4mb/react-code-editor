import { useEffect, useRef } from "react";
import { useEditor } from "../Editor";
import { Diagnostic } from "../type";

interface DiagnosticsProviderProps {
    children: React.ReactNode;
    validator?: (code: string) => Diagnostic[];
}

export default function DiagnosticsProvider({ children, validator }: DiagnosticsProviderProps) {
    const { state, dispatch } = useEditor();
    const lastDiagnosticsRef = useRef<Diagnostic[]>([]);

    useEffect(() => {
        if (!validator) {
            if (lastDiagnosticsRef.current.length > 0) {
                lastDiagnosticsRef.current = [];
                dispatch({ type: "SET_DIAGNOSTICS", payload: [] });
            }
            return;
        }

        const diagnostics = validator(state.code);
        
        const isSame = diagnostics.length === lastDiagnosticsRef.current.length &&
            diagnostics.every((d, i) => {
                const prev = lastDiagnosticsRef.current[i];
                return d.range[0] === prev.range[0] &&
                       d.range[1] === prev.range[1] &&
                       d.message === prev.message &&
                       d.severity === prev.severity;
            });

        if (!isSame) {
            lastDiagnosticsRef.current = diagnostics;
            dispatch({ type: "SET_DIAGNOSTICS", payload: diagnostics });
        }
    }, [state.code, validator, dispatch]);

    return <>{children}</>;
}
