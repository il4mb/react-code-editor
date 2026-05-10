import { WidgetComponentProps } from "../../type";
import { styled } from "@mui/system";

const ToggleButton = styled("span")({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "14px",
    borderRadius: "7px",
    backgroundColor: "#333",
    border: "1px solid #555",
    cursor: "pointer",
    marginLeft: "4px",
    position: "relative",
    verticalAlign: "middle",
    transition: "background-color 0.2s",
    "&.active": {
        backgroundColor: "#a277ff",
        borderColor: "#b58dff",
    },
});

const ToggleCircle = styled("span")({
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#fff",
    position: "absolute",
    left: "1px",
    transition: "left 0.2s",
    ".active &": {
        left: "11px",
    },
});

export function BooleanWidget({ token, onChange }: WidgetComponentProps) {
    const value = token.text === "true";
    
    const toggle = () => {
        onChange(value ? "false" : "true");
    };

    return (
        <ToggleButton className={value ? "active" : ""} onClick={toggle}>
            <ToggleCircle />
        </ToggleButton>
    );
}

BooleanWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        const regex = /\b(true|false)\b/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};

