import { WidgetComponentProps } from "../../type";
import { styled } from "@mui/system";

const ObjBadge = styled("span")({
    display: "inline-flex",
    padding: "0 4px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "3px",
    fontSize: "9px",
    color: "#888",
    marginLeft: "4px",
    verticalAlign: "middle",
    cursor: "help",
});

export function ObjectWidget({ token }: WidgetComponentProps) {
    return <ObjBadge>{'{...}'}</ObjBadge>;
}

ObjectWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        // Match opening braces that likely start an object (after = or :)
        const regex = /[=:]\s*\{/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            // Point to the brace itself
            const braceIndex = match.index + match[0].indexOf('{');
            ranges.push([braceIndex, braceIndex + 1]);
        }
        return ranges;
    }
};
