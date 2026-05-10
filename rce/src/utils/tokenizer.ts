import { Token, WidgetComponent } from "../type"
import { normalizeRange } from "./range"

type RawToken = Token & {
    widgetKey: string
    widgetIndex: number
    tokenIndex: number
}

const componentIds = new WeakMap<WidgetComponent, string>()
let nextComponentId = 0

function getComponentId(component: WidgetComponent) {
    const existing = componentIds.get(component)
    if (existing) return existing

    const id = `widget-${nextComponentId++}`
    componentIds.set(component, id)
    return id
}

function compareRawTokens(left: RawToken, right: RawToken) {
    if (left.range[0] !== right.range[0]) return left.range[0] - right.range[0]

    const leftLength = left.range[1] - left.range[0]
    const rightLength = right.range[1] - right.range[0]
    if (leftLength !== rightLength) return rightLength - leftLength

    if (left.widgetIndex !== right.widgetIndex) return left.widgetIndex - right.widgetIndex
    if (left.widgetKey !== right.widgetKey) return left.widgetKey.localeCompare(right.widgetKey)

    return left.tokenIndex - right.tokenIndex
}

export function buildTokens(code: string, widgets: { [key: string]: WidgetComponent }): Token[] {

    const rawTokens: RawToken[] = []
    const entries = Object.entries(widgets)

    for (let widgetIndex = 0; widgetIndex < entries.length; widgetIndex += 1) {
        const [widgetKey, component] = entries[widgetIndex]
        const ranges = component.widget?.tokenizer(code) ?? []

        for (let tokenIndex = 0; tokenIndex < ranges.length; tokenIndex += 1) {
            const normalized = normalizeRange(ranges[tokenIndex], code.length)
            if (!normalized) continue

            rawTokens.push({
                component,
                range: normalized,
                widgetKey,
                widgetIndex,
                tokenIndex
            })
        }
    }

    rawTokens.sort(compareRawTokens)

    const deduped: Token[] = []
    const seen = new Set<string>()

    for (const token of rawTokens) {
        const id = `${getComponentId(token.component)}:${token.range[0]}:${token.range[1]}`
        if (seen.has(id)) continue
        seen.add(id)
        deduped.push({ 
            component: token.component, 
            range: token.range,
            text: code.slice(token.range[0], token.range[1])
        })
    }

    return deduped
}

export function compareTokens(left: Token, right: Token) {
    if (left.range[0] !== right.range[0]) return left.range[0] - right.range[0]
    if (left.range[1] !== right.range[1]) return left.range[1] - right.range[1]
    if (left.component === right.component) return 0
    return getComponentId(left.component).localeCompare(getComponentId(right.component))
}

export function getTokenId(token: Token) {
    return `${getComponentId(token.component)}:${token.range[0]}:${token.range[1]}`
}
