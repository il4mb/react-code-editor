import { createContext, JSX, ReactNode, useContext, useReducer, useEffect } from "react"
import { editorReducer } from "./cores/reducer"
import { EditorAction, EditorState } from "./type"

interface EditorProps {
    children?: ReactNode
    initialValue?: string
    onChange?: (code: string) => void
}

export default function Editor({ children, initialValue, onChange }: EditorProps): JSX.Element {
    const [state, dispatch] = useReducer(editorReducer, {
        code: initialValue ?? "",
        tokens: [],
        widgets: {},
        selection: null,
        position: null,
        caretCoordinates: null,
        suggestions: [],
        suggestionIndex: 0,
        diagnostics: []
    })

    // Trigger onChange when code updates
    useEffect(() => {
        onChange?.(state.code)
    }, [state.code, onChange])

    return (
        <Context.Provider value={{ state, dispatch }}>
            {children}
        </Context.Provider>
    )
}

export type TEditorContext = {
    state: EditorState
    dispatch: React.Dispatch<EditorAction>
}

const Context = createContext<TEditorContext | undefined>(undefined)

export const useEditor = () => {
    const context = useContext(Context)
    if (!context) throw new Error("useEditor must be used within Editor")
    return context
}   