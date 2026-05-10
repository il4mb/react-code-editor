import { WidgetComponentProps } from "../../type";
import { styled } from "@mui/system";

const ColorPreview = styled("span")({
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "2px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer",
    marginLeft: "4px",
    verticalAlign: "middle",
    position: "relative",
    "&:hover": {
        transform: "scale(1.2)",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    },
});

export function JSColorWidget({ token, onChange }: WidgetComponentProps) {
    const text = token.text;
    // Extract color from string (removing quotes)
    const quote = text[0];
    const colorValue = text.slice(1, -1);

    const onColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(`${quote}${e.target.value}${quote}`);
    };

    return (
        <ColorPreview style={{ backgroundColor: colorValue }}>
            <input
                type="color"
                value={colorValue.startsWith("#") ? colorValue : "#ffffff"}
                onChange={onColorChange}
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                }}
            />
        </ColorPreview>
    );
}

JSColorWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        // Match strings that contain hex colors or standard color names
        const regex = /(['"`])(#[0-9a-fA-F]{3,6}|red|blue|green|yellow|black|white|transparent|pink|purple|orange|cyan)\1/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};
