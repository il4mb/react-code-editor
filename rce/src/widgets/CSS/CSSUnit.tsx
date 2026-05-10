import { Fragment, useEffect, useState } from "react"
import { WidgetComponent } from "../../type"
import WidgetPortal from "../../cores/WidgetPortal"
import { useEditor } from "../../Editor"

const CSS_UNIT_PATTERN =
    /-?\d*\.?\d+(?:px|r?em|lh|rlh|%|vh|vw|vmin|vmax|vi|vb|ch|ex|cap|ic|cm|mm|q|in|pt|pc|deg|grad|rad|turn|s|ms|hz|khz|dppx|dpi|dpcm|fr)\b/gi

export const CSSUnit: WidgetComponent = ({ children, token }) => {
    const { state: { position } } = useEditor()
    const [visible, setVisible] = useState(false)
    const toggleVisible = () => setVisible(v => !v)

    useEffect(() => {
        setVisible(false)
    }, [position])

    return (
        <Fragment>
            <span className="widget-css-unit" onClick={toggleVisible}>
                {children}
            </span>
            {visible && (
                <WidgetPortal>
                    <div
                        style={{
                            background: "#fff"
                        }}>
                        <div style={{ fontSize: 12, color: "#555" }}>CSS Unit</div>
                        <div style={{ marginTop: 8 }}>
                            {token.component.widget.tokenizer.toString()}
                        </div>
                    </div>
                </WidgetPortal>
            )}
        </Fragment>
    )
}

CSSUnit.widget = {
    tokenizer(code: string) {
        const ranges: [number, number][] = []
        let match: RegExpExecArray | null

        CSS_UNIT_PATTERN.lastIndex = 0
        while ((match = CSS_UNIT_PATTERN.exec(code)) !== null) {
            const unitOffset = match[0].search(/[a-z%]/i)
            if (unitOffset < 0) continue

            const start = match.index + unitOffset
            ranges.push([start, start + match[0].length - unitOffset])
        }

        return ranges
    }
}
