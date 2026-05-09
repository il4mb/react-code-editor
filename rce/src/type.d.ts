// types.d.ts (Your exact types)
export type Range = [number, number]
export type Token = {
    component: WidgetComponent
    range: Range
}
export type WidgetComponent = React.FC<{
    children?: React.ReactNode
    token: Token
}> & {
    widget: {
        tokenizer(code: string): Range[]
    }
}

export interface CaretCoordinates {
    x: number
    y: number
    height: number
}

export interface EditorState {
    code: string
    tokens: Token[]
    widgets: { [key: string]: WidgetComponent }
    position: number | null
    selection: Range | null
    caretCoordinates: CaretCoordinates | null
}
export type EditorActionMap = {
    SET_TOKENS: Token[]
    SET_WIDGETS: { [key: string]: WidgetComponent }
    SET_CODE: string
    SET_SELECTION: Range | null
    SET_POSITION: number | null
    SET_CARET_COORDINATES: CaretCoordinates | null
}
export type EditorAction = {
    [Key in keyof EditorActionMap]: [EditorActionMap[Key]] extends [never]
    ? { type: Key }
    : undefined extends EditorActionMap[Key]
    ? { type: Key; payload?: EditorActionMap[Key] }
    : { type: Key; payload: EditorActionMap[Key] }
}[keyof EditorActionMap]
