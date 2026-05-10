import { WidgetComponentProps } from "../../type";
import { styled } from "@mui/system";

const FuncIcon = styled("span")({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: "rgba(162, 119, 255, 0.2)",
    color: "#a277ff",
    fontSize: "10px",
    cursor: "pointer",
    marginLeft: "4px",
    verticalAlign: "middle",
    "&:hover": {
        backgroundColor: "rgba(162, 119, 255, 0.4)",
        transform: "rotate(90deg)",
    },
    transition: "all 0.2s",
});

export function FunctionWidget({ children, token }: WidgetComponentProps) {
    return (
        <>
            <FuncIcon 
                title={`Function defined at offset ${token.range[0]}`}
                contentEditable={false}
                data-ignore="true"
            >
                λ
            </FuncIcon>
            {children}
        </>
    );
}

FunctionWidget.widget = {
    tokenizer: (code: string) => {
        const ranges: [number, number][] = [];
        // Match function keyword or arrow function
        const regex = /\bfunction\b|\(\)\s*=>|=>/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            ranges.push([match.index, match.index + match[0].length]);
        }
        return ranges;
    }
};
