import { EditorAction, EditorState } from "../type"
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
    let nextState: EditorState = state

    switch (action.type) {
        case "SET_TOKENS":
            nextState = {
                ...state,
                tokens: action.payload
            }
            break
        case "SET_WIDGETS":
            nextState = {
                ...state,
                widgets: action.payload
            }
            break
        case "SET_CODE":
            nextState = {
                ...state,
                code: action.payload
            }
            break
        case "SET_SELECTION":
            nextState = {
                ...state,
                selection: action.payload
            }
            break
        case "SET_POSITION":
            nextState = {
                ...state,
                position: action.payload
            }
            break
        case "SET_CARET_COORDINATES":
            nextState = {
                ...state,
                caretCoordinates: action.payload
            }
            break
        default:
            nextState = state
    }

    return nextState
}
