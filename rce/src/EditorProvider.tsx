import { createContext, useContext, useEffect, useMemo, useReducer } from "react"
import { EditorAction, EditorState, WidgetComponent } from "./type"
import { editorReducer } from "./cores/reducer"
import { buildTokens } from "./utils/tokenizer"
import { MentionWidget } from "./widgets/MentionWidget"
import { CSSName } from "./widgets/CSS/CSSName"
import { CSSUnit } from "./widgets/CSS/CSSUnit"
import ColorHighlight from "./widgets/ColorHighlight"
import Shell from "./cores/Shell"
import "./styles.scss"

interface EditorProps {
    initialValue?: string
    widgets?: { [key: string]: WidgetComponent }
}

export type EditorContextType = {
    state: EditorState
    dispatch: React.Dispatch<EditorAction>
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export const useEditorContext = () => {
    const context = useContext(EditorContext)
    if (!context)
        throw new Error("useEditorContext must be used within a EditorProvider")
    return context
}

export function useCodeState() {
    return useEditorContext().state
}

export function useCodePosition() {
    return useEditorContext().state.position
}

export function useCodeDispatch() {
    return useEditorContext().dispatch
}

const defaultWidgets = {
    MentionWidget,
    CSSName,
    CSSUnit,
    ColorHighlight
}
// prettier-ignore
function createInitialState(initialValue: string, widgets: { [key: string]: WidgetComponent }): EditorState {
    return {
        code: initialValue,
        selection: [0, 0],
        position: 0,
        caretCoordinates: null,
        tokens: buildTokens(initialValue, widgets),
        widgets
    }
}

// prettier-ignore
export default function Editor({ initialValue = "", widgets = defaultWidgets }: EditorProps) {
    const resolvedWidgets = useMemo(
        () => ({ ...defaultWidgets, ...widgets }),
        [widgets]
    )

    const [state, dispatch] = useReducer(
        editorReducer,
        createInitialState(initialValue, resolvedWidgets)
    )

    useEffect(() => {
        dispatch({ type: "SET_WIDGETS", payload: resolvedWidgets })
    }, [dispatch, resolvedWidgets])

    return (
        <EditorContext.Provider value={{ state, dispatch }}>
            <Shell />
        </EditorContext.Provider>
    )
}
