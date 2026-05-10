import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WidgetComponent } from "../type";
import { buildTokens } from "../utils/tokenizer";
import { useEditor } from "../Editor";

type Props = {
    children: React.ReactNode;
    widgets: {
        [key: string]: WidgetComponent;
    };
};
export default function WidgetsProvider({ children, widgets: initialWidgets, }: Props) {
    const [widgets, setWidgets] = useState(initialWidgets);
    useEffect(() => {
        setWidgets(prev => ({
            ...prev,
            ...initialWidgets
        }));
    }, [initialWidgets]);

    const values = useMemo(() => ({
        ...widgets
    }), [widgets]);

    return (
        <WidgetContext.Provider value={values}>
            {children}
        </WidgetContext.Provider>
    );
}

interface WidgetMap {
    [key: string]: WidgetComponent;
}
const WidgetContext = createContext<WidgetMap | undefined>(undefined);

export const useWidgets = () => {
    const context = useContext(WidgetContext);
    return context ?? {};
};
