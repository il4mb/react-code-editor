import { Token, WidgetComponent } from "../types"
import { normalizeRange } from "./range"

type RawToken = {
    component: WidgetComponent
    range: [number, number]
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

/** 
 * Build tokens from code using provided widgets.
 * reconciles with previous tokens to maintain stable IDs.
 */
export function buildTokens(code: string, widgets: { [key: string]: WidgetComponent }, prevTokens: Token[] = []): Token[] {
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

    const result: Token[] = []
    const seen = new Set<string>()

    // Reconcile with previous tokens to keep IDs stable
    for (const raw of rawTokens) {
        const text = code.slice(raw.range[0], raw.range[1]);
        const compId = getComponentId(raw.component);
        
        // Find best match in prevTokens
        // A match must have the same component and significantly overlapping range
        let id = `${compId}:${raw.range[0]}:${raw.range[1]}`;
        
        const existing = prevTokens.find(t => 
            t.component === raw.component && 
            Math.abs(t.range[0] - raw.range[0]) < 500 // Nearby
        );

        if (existing) {
            // If the text or range changed but it's the "same" logical token, keep the ID
            // We use a persistent ID if possible
            id = existing.id;
        }

        // Handle duplicates in same pass
        let finalId = id;
        let counter = 0;
        while (seen.has(finalId)) {
            finalId = `${id}:${counter++}`;
        }
        seen.add(finalId);

        result.push({
            id: finalId,
            component: raw.component,
            range: raw.range,
            text
        })
    }

    return result
}

export function compareTokens(left: Token, right: Token) {
    if (left.range[0] !== right.range[0]) return left.range[0] - right.range[0]
    if (left.range[1] !== right.range[1]) return left.range[1] - right.range[1]
    if (left.component === right.component) return 0
    return getComponentId(left.component).localeCompare(getComponentId(right.component))
}

export function getTokenId(token: Token) {
    return token.id || `${getComponentId(token.component)}:${token.range[0]}:${token.range[1]}`
}
