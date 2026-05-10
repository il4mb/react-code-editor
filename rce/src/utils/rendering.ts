import { Diagnostic, Highlight, Token, WidgetComponent } from "../types"
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
        
        let finalKey = `plain:${start}`

        if (sortedActiveTokens.length > 0) {
            // Keep widget-hosting segments stable while token text length changes.
            // Using token IDs + start avoids remounting during interactive updates.
            finalKey = `token:${sortedActiveTokens.map(token => getTokenId(token)).join("|")}:start:${start}`
        } else if (activeHighlights.length > 0) {
            const highlightKey = activeHighlights
                .map(highlight => `${highlight.className ?? "colored"}:${highlight.range[0]}`)
                .join("|")
            finalKey = `hl:${highlightKey}:start:${start}`
        } else if (activeDiagnostics.length > 0) {
            const diagnosticKey = activeDiagnostics
                .map(diagnostic => `${diagnostic.severity}:${diagnostic.range[0]}`)
                .join("|")
            finalKey = `diag:${diagnosticKey}:start:${start}`
        }

        segments.push({
            key: finalKey,
            start,
            end,
            text: code.slice(start, end),
            tokens: sortedActiveTokens,
            diagnostics: activeDiagnostics,
            highlights: activeHighlights
        })
    }

    return segments.length ? segments : [{ key: "plain:0", start: 0, end: code.length, text: code, tokens: [], diagnostics: [], highlights: [] }]
}
