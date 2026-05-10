import { createContext, JSX, ReactNode, useContext, useReducer } from "react"
import { editorReducer } from "./cores/reducer"
import { EditorAction, EditorState } from "./type"

interface EditorProps {
    children?: ReactNode
    initialValue?: string
}

export default function Editor({ children, initialValue }: EditorProps): JSX.Element {
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