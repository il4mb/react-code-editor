import { styled } from "@mui/system"
import { WidgetComponent } from "../../type"

const Span = styled("span")({
    color: "#ac6b0aff"
})
export const CSSName: WidgetComponent = ({ children }) => {
    return (
        <Span>
            {children}
        </Span>
    )
}
CSSName.widget = {
    tokenizer(code: string) {
        const regex = /[a-zA-Z-]+(?=\s*:)/g
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
