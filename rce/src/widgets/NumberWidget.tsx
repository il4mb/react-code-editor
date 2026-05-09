import { WidgetComponent } from "../type"

const NUMBER_PATTERN = /(^|[^\w.])(-?(?:\d+\.\d+|\d+|\.\d+)(?:e[+-]?\d+)?)(?![\w%])/gi

export const NumberWidget: WidgetComponent = ({ children, token }) => {
    return (
        <span
            className="widget-number"
            data-token-start={token.range[0]}
            data-token-end={token.range[1]}>
            {children}
        </span>
    )
}

NumberWidget.widget = {
    tokenizer(code: string) {
        const ranges: [number, number][] = []
        let match: RegExpExecArray | null

        NUMBER_PATTERN.lastIndex = 0
        while ((match = NUMBER_PATTERN.exec(code)) !== null) {
            const prefixLength = match[1]?.length ?? 0
            const start = match.index + prefixLength
            const end = start + match[2].length
            ranges.push([start, end])
        }

        return ranges
    }
}