import { Diagnostic, Highlight, Token, WidgetComponent } from "../type"
import { getTokenId } from "./tokenizer"
import { containsRange, rangeLength } from "./range"

export type RenderSegment = {
    key: string
    start: number
    end: number
    text: string
    tokens: Token[]
    diagnostics: Diagnostic[]
    highlights: Highlight[]
}

const componentIds = new WeakMap<WidgetComponent, string>()
let nextComponentId = 0

function getComponentId(component: WidgetComponent) {
    const existing = componentIds.get(component)
    if (existing) return existing

    const id = `component-${nextComponentId++}`
    componentIds.set(component, id)
    return id
}

function sortActiveTokens(tokens: Token[]) {
    return [...tokens].sort((left, right) => {
        const leftLength = rangeLength(left.range)
        const rightLength = rangeLength(right.range)

        if (leftLength !== rightLength) return rightLength - leftLength
        if (left.range[0] !== right.range[0]) return left.range[0] - right.range[0]
        if (left.range[1] !== right.range[1]) return right.range[1] - left.range[1]

        return getComponentId(left.component).localeCompare(getComponentId(right.component))
    })
}

export function buildRenderSegments(
    code: string, 
    tokens: Token[], 
    diagnostics: Diagnostic[] = [], 
    extraBoundaries: number[] = [],
    highlights: Highlight[] = []
): RenderSegment[] {
    if (!code.length) {
        return [{ key: "empty", start: 0, end: 0, text: "", tokens: [], diagnostics: [], highlights: [] }]
    }

    const boundaries = new Set<number>([0, code.length])
    for (const token of tokens) {
        boundaries.add(token.range[0])
        boundaries.add(token.range[1])
    }
    for (const diagnostic of diagnostics) {
        boundaries.add(diagnostic.range[0])
        boundaries.add(diagnostic.range[1])
    }
    for (const highlight of highlights) {
        boundaries.add(highlight.range[0])
        boundaries.add(highlight.range[1])
    }
    for (const boundary of extraBoundaries) {
        if (boundary >= 0 && boundary <= code.length) {
            boundaries.add(boundary)
        }
    }

    const orderedBoundaries = Array.from(boundaries)
        .filter(boundary => boundary >= 0 && boundary <= code.length)
        .sort((left, right) => left - right)

    const segments: RenderSegment[] = []

    for (let index = 0; index < orderedBoundaries.length - 1; index += 1) {
        const start = orderedBoundaries[index]
        const end = orderedBoundaries[index + 1]
        if (start >= end) continue

        const activeTokens = tokens.filter(token => containsRange(token.range, [start, end]))
        const sortedActiveTokens = sortActiveTokens(activeTokens)
        
        const activeDiagnostics = diagnostics.filter(diagnostic => containsRange(diagnostic.range, [start, end]))
        const activeHighlights = highlights.filter(highlight => containsRange(highlight.range, [start, end]))
        
        const key = `${start}:${end}:${sortedActiveTokens.length ? sortedActiveTokens.map(getTokenId).join("|") : "plain"}:${activeDiagnostics.length ? activeDiagnostics.map(d => `${d.severity}-${d.message}`).join("|") : "clean"}:${activeHighlights.length ? activeHighlights.map(h => `${h.color}-${h.className}`).join("|") : "neutral"}`

        segments.push({
            key,
            start,
            end,
            text: code.slice(start, end),
            tokens: sortedActiveTokens,
            diagnostics: activeDiagnostics,
            highlights: activeHighlights
        })
    }

    return segments.length ? segments : [{ key: "plain", start: 0, end: code.length, text: code, tokens: [], diagnostics: [], highlights: [] }]
}
