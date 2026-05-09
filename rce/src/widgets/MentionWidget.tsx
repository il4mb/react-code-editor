import { WidgetComponent } from "../type"

export const MentionWidget: WidgetComponent = ({ children, token }) => {
    return (
        <span
            className="widget-mention"
            data-token-start={token.range[0]}
            data-token-end={token.range[1]}>
            {children}
        </span>
    )
}

MentionWidget.widget = {
    tokenizer(code: string) {
        // Find @username patterns
        const regex = /@[A-Za-z0-9_]+/g
        const matches = code.matchAll(regex)
        const ranges: [number, number][] = []
        for (const match of matches) {
            if (match.index !== undefined) {
                ranges.push([match.index, match.index + match[0].length])
            }
        }
        return ranges
    }
}
