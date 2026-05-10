import React from "react"

/** Represents a range in the code as [start, end] */
export type Range = [number, number]

/** A token represents a decorated range of code */
export type Token = {
    id: string
    component: WidgetComponent
    range: Range
    text: string
}

export type WidgetTokenizer = (code: string) => Range[]

export interface WidgetComponentProps {
    children?: React.ReactNode
    token: Token
    renderDecorator?: boolean
}

export interface WidgetDefinition {
    /** Returns ranges in the code that should be decorated with this widget */
    tokenizer: WidgetTokenizer
}

/** A component that renders a token and provides a tokenizer */
export type WidgetComponent = React.FC<WidgetComponentProps> & {
    widget: WidgetDefinition
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

export interface Highlight {
    range: Range
    color?: string
    backgroundColor?: string
    fontWeight?: string
    fontStyle?: string
    className?: string
}

/** Global state of the editor */
export interface EditorState {
    code: string
    tokens: Token[]
    highlights: Highlight[]
    widgets: { [key: string]: WidgetComponent }
    position: number | null
    selection: Range | null
    caretCoordinates: CaretCoordinates | null
    suggestions: string[]
    suggestionIndex: number
    diagnostics: Diagnostic[]
    activeTokenId: string | null
    hoveredTokenId: string | null
}

/** Mapping of action types to their payloads */
export type EditorActionMap = {
    SET_TOKENS: Token[]
    SET_HIGHLIGHTS: Highlight[]
    SET_WIDGETS: { [key: string]: WidgetComponent }
    SET_CODE: string
    SET_SELECTION: Range | null
    SET_POSITION: number | null
    SET_CARET_COORDINATES: CaretCoordinates | null
    SET_SUGGESTIONS: string[]
    SET_SUGGESTION_INDEX: number
    SET_DIAGNOSTICS: Diagnostic[]
    SET_TOKEN_TEXT: { tokenId: string, newText: string }
    SET_ACTIVE_TOKEN: string | null
    SET_HOVERED_TOKEN: string | null
    UPDATE: Partial<EditorState>
}

/** Union of all possible editor actions */
export type EditorAction = {
    [Key in keyof EditorActionMap]: [EditorActionMap[Key]] extends [never]
    ? { type: Key }
    : undefined extends EditorActionMap[Key]
    ? { type: Key; payload?: EditorActionMap[Key] }
    : { type: Key; payload: EditorActionMap[Key] }
}[keyof EditorActionMap]
