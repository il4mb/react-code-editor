import { createContext, useContext, useEffect, useState } from "react";
import { WidgetComponent } from "../type";

type Props = {
    children: React.ReactNode;
    widgets: {
        [key: string]: WidgetComponent;
    };
};
export default function WidgetsProvider({ children, widgets: initialWidgets, }: Props) {
    const [widgets, setWidgets] = useState(initialWidgets);
    useEffect(() => {
        setWidgets(initialWidgets);
    }, [initialWidgets]);
    return (
        <WidgetContext.Provider value={{ widgets }}>
            {children}
        </WidgetContext.Provider>
    );
}

interface WidgetContextType {
    widgets: {
        [key: string]: WidgetComponent;
    };
}
const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const useWidgetContext = () => {
    const context = useContext(WidgetContext);
    if (!context)
        throw new Error("useWidgetContext must be used within WidgetsProvider");
    return context;
};
