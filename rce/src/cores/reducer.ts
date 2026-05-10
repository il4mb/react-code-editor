import { EditorAction, EditorState } from "../types"
import { buildTokens, getTokenId } from "../utils/tokenizer"

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
    let nextState: EditorState = state

    switch (action.type) {
        case "SET_TOKENS":
            nextState = {
                ...state,
                tokens: action.payload
            }
            break
        case "SET_HIGHLIGHTS":
            nextState = {
                ...state,
                highlights: action.payload
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
        case "UPDATE":
            nextState = {
                ...state,
                ...action.payload
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
        case "SET_SUGGESTIONS":
            nextState = {
                ...state,
                suggestions: action.payload,
                suggestionIndex: 0
            }
            break
        case "SET_SUGGESTION_INDEX":
            nextState = {
                ...state,
                suggestionIndex: action.payload
            }
            break
        case "SET_TOKEN_TEXT": {
            const { tokenId, newText } = action.payload
            const token = state.tokens.find(t => getTokenId(t) === tokenId)
            if (!token) return state

            const newCode = state.code.slice(0, token.range[0]) + newText + state.code.slice(token.range[1])
            return {
                ...state,
                code: newCode,
                tokens: buildTokens(newCode, state.widgets)
            }
        }
        case "SET_DIAGNOSTICS":
            nextState = {
                ...state,
                diagnostics: action.payload
            }
            break
        default:
            nextState = state
    }

    return nextState
}
