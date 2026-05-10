/** Represents a range in the code as [start, end] */
export type Range = [number, number]

/** A token represents a decorated range of code */
export type Token = {
    component: WidgetComponent
    range: Range
}

/** A component that renders a token and provides a tokenizer */
export type WidgetComponent = React.FC<{
    children?: React.ReactNode
    token: Token
}> & {
    widget: {
        /** Returns ranges in the code that should be decorated with this widget */
        tokenizer(code: string): Range[]
    }
}

/** Coordinates of the caret in the editor */
export interface CaretCoordinates {
    x: number
    y: number
    height: number
}

/** A diagnostic represents an error, warning, or info message for a range of code */
export interface Diagnostic {
    range: Range
    message: string
    severity: 'error' | 'warning' | 'info'
}

/** Global state of the editor */
export interface EditorState {
    code: string
    tokens: Token[]
    widgets: { [key: string]: WidgetComponent }
    position: number | null
    selection: Range | null
    caretCoordinates: CaretCoordinates | null
    suggestions: string[]
    suggestionIndex: number
    diagnostics: Diagnostic[]
}

/** Mapping of action types to their payloads */
export type EditorActionMap = {
    SET_TOKENS: Token[]
    SET_WIDGETS: { [key: string]: WidgetComponent }
    SET_CODE: string
    SET_SELECTION: Range | null
    SET_POSITION: number | null
    SET_CARET_COORDINATES: CaretCoordinates | null
    SET_SUGGESTIONS: string[]
    SET_SUGGESTION_INDEX: number
    SET_DIAGNOSTICS: Diagnostic[]
}

/** Union of all possible editor actions */
export type EditorAction = {
    [Key in keyof EditorActionMap]: [EditorActionMap[Key]] extends [never]
    ? { type: Key }
    : undefined extends EditorActionMap[Key]
    ? { type: Key; payload?: EditorActionMap[Key] }
    : { type: Key; payload: EditorActionMap[Key] }
}[keyof EditorActionMap]

