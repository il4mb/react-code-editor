import { WidgetComponentProps } from "../../type";
import { styled } from "@mui/system";

const NullBadge = styled("span")({
    display: "inline-flex",
    padding: "0 4px",
    backgroundColor: "rgba(255, 69, 0, 0.15)",
    border: "1px solid rgba(255, 69, 0, 0.3)",
    borderRadius: "4px",
    fontSize: "9px",
    color: "#ff4500",
    marginLeft: "4px",
    verticalAlign: "middle",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
});

export function NullWidget({ token }: WidgetComponentProps) {
    return <NullBadge>∅ {token.text}</NullBadge>;
}

NullWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        const regex = /\b(null|undefined|NaN|Infinity)\b/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};
