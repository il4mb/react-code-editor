import { Range } from "../type"
import { clampOffset, isRangeCollapsed } from "./range"

type EditResult = {
    code: string
    selection: Range
    position: number
}

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null

function graphemeBoundaries(code: string) {
    if (!segmenter) {
        return Array.from({ length: code.length + 1 }, (_, index) => index)
    }

    const boundaries = [0]
    for (const segment of segmenter.segment(code) as unknown as Array<{ index: number; segment: string }>) {
        boundaries.push(segment.index + segment.segment.length)
    }

    return Array.from(new Set(boundaries)).sort((left, right) => left - right)
}

function previousBoundary(code: string, offset: number) {
    const boundaries = graphemeBoundaries(code)
    let candidate = 0

    for (const boundary of boundaries) {
        if (boundary >= offset) break
        candidate = boundary
    }

    return candidate
}

function nextBoundary(code: string, offset: number) {
    const boundaries = graphemeBoundaries(code)
    for (const boundary of boundaries) {
        if (boundary > offset) return boundary
    }
    return code.length
}

function replaceRange(code: string, start: number, end: number, insertion: string): EditResult {
    const normalizedStart = clampOffset(Math.min(start, end), code.length)
    const normalizedEnd = clampOffset(Math.max(start, end), code.length)
    const nextCode = `${code.slice(0, normalizedStart)}${insertion}${code.slice(normalizedEnd)}`
    const cursor = normalizedStart + insertion.length

    return {
        code: nextCode,
        selection: [cursor, cursor],
        position: cursor
    }
}

function getSelection(selection: Range | null, position: number | null, codeLength: number) {
    if (selection) return selection
    const caret = clampOffset(position ?? codeLength, codeLength)
    return [caret, caret] as Range
}

function selectionStart(selection: Range) {
    return Math.min(selection[0], selection[1])
}

function selectionEnd(selection: Range) {
    return Math.max(selection[0], selection[1])
}

function lineStart(code: string, offset: number) {
    const clamped = clampOffset(offset, code.length)
    return code.lastIndexOf("\n", Math.max(0, clamped - 1)) + 1
}

function getIndentUnit(code: string, offset: number) {
    const start = lineStart(code, offset)
    const line = code.slice(start, offset)
    return line.match(/^[\t ]+/)?.[0] ?? ""
}

function shouldIncreaseIndent(code: string, offset: number) {
    const start = lineStart(code, offset)
    const line = code.slice(start, offset).trimEnd()
    return /[\{\[\(]$|:$/.test(line)
}

export function insertText(state: { code: string; selection: Range | null; position: number | null }, text: string): EditResult {
    const selection = getSelection(state.selection, state.position, state.code.length)
    return replaceRange(state.code, selection[0], selection[1], text)
}

export function replaceSelection(state: { code: string; selection: Range | null; position: number | null }, text: string): EditResult {
    return insertText(state, text)
}

export function deleteBackward(state: { code: string; selection: Range | null; position: number | null }): EditResult {
    const selection = getSelection(state.selection, state.position, state.code.length)
    if (!isRangeCollapsed(selection)) {
        return replaceRange(state.code, selection[0], selection[1], "")
    }

    const caret = selectionStart(selection)
    if (caret === 0) {
        return {
            code: state.code,
            selection,
            position: caret
        }
    }

    return replaceRange(state.code, previousBoundary(state.code, caret), caret, "")
}

export function deleteForward(state: { code: string; selection: Range | null; position: number | null }): EditResult {
    const selection = getSelection(state.selection, state.position, state.code.length)
    if (!isRangeCollapsed(selection)) {
        return replaceRange(state.code, selection[0], selection[1], "")
    }

    const caret = selectionStart(selection)
    if (caret >= state.code.length) {
        return {
            code: state.code,
            selection,
            position: caret
        }
    }

    return replaceRange(state.code, caret, nextBoundary(state.code, caret), "")
}

export function insertNewLine(state: { code: string; selection: Range | null; position: number | null }): EditResult {
    const selection = getSelection(state.selection, state.position, state.code.length)
    const start = selectionStart(selection)
    const end = selectionEnd(selection)
    const baseIndent = getIndentUnit(state.code, start)
    const extraIndent = shouldIncreaseIndent(state.code, start) ? "    " : ""

    return replaceRange(state.code, start, end, `\n${baseIndent}${extraIndent}`)
}

export function indent(state: { code: string; selection: Range | null; position: number | null }, indentUnit = "    "): EditResult {
    const selection = getSelection(state.selection, state.position, state.code.length)
    const start = selectionStart(selection)
    const end = selectionEnd(selection)

    if (isRangeCollapsed(selection)) {
        return replaceRange(state.code, start, end, indentUnit)
    }

    const before = state.code.slice(0, start)
    const middle = state.code.slice(start, end)
    const after = state.code.slice(end)
    const lines = middle.split("\n")
    const indented = lines.map(line => `${indentUnit}${line}`).join("\n")

    return {
        code: `${before}${indented}${after}`,
        selection: [start + indentUnit.length, end + indentUnit.length * lines.length],
        position: end + indentUnit.length * lines.length
    }
}

export function applyTextInput(state: { code: string; selection: Range | null; position: number | null }, text: string) {
    return replaceSelection(state, text)
}
