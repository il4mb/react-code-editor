import { WidgetComponent } from "../type"

export const LineWidget: WidgetComponent = ({ children, token }) => {
    return (
        <span
            className="line-widget"
            data-token-start={token.range[0]}
            data-token-end={token.range[1]}>
            {children}
        </span>
    )
}

LineWidget.widget = {
    tokenizer(code: string) {
        const lines = code.split("\n")
        const ranges: [number, number][] = []
        let offset = 0
        for (const line of lines) {
            ranges.push([offset, offset + line.length])
            offset += line.length + 1 // +1 for the newline character
        }
        return ranges
    }
}
