import { Editor, Shell, useEditor, WidgetsProvider, SuggestionsProvider } from '@il4mb/rce'
import { ColorWidget, CSSName, CSSUnit, NumberWidget } from '@il4mb/rce/widgets'
import { useEffect, useState } from 'react';


const MyParser = ({ children, onChange }: { children: any, onChange: (data: Record<string, string>) => void }) => {
    const { state } = useEditor();

    useEffect(() => {
        const rawCode = state.code;
        const records: [string, string][] = []
        for (let line of rawCode.split("\n")) {
            const partOfLine = line.split(":")
            const key = String(partOfLine[0]).trim()
            const value = String(partOfLine[1]).trim()
            if (!key) continue;
            records.push([key, value])
        }
        const object = Object.fromEntries(records);
        onChange?.(object);
    }, [state.code, onChange])
    return children
}

const CSS_VALUES: Record<string, string[]> = {
    'display': ['block', 'flex', 'grid', 'inline', 'inline-block', 'none'],
    'position': ['absolute', 'fixed', 'relative', 'static', 'sticky'],
    'color': ['red', 'blue', 'green', 'yellow', 'black', 'white', 'transparent'],
    'border': ['1px solid black', '2px dashed red', 'none']
}

function App() {

    const [style, setStyle] = useState<Record<string, string>>({})
    return (
        <div style={{ padding: '2rem' }}>
            <h1>React Code Editor Test</h1>
            <div style={{ padding: 10, border: '1px solid #333', marginBottom: 10 }}>
                <div style={style}>
                    Hallo World
                </div>
            </div>
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', height: '400px', padding: 10 }}>

                <Editor initialValue="color:#f00
border:30px
height:30px">
                    <MyParser onChange={setStyle}>
                        <WidgetsProvider widgets={{ ColorWidget, NumberWidget, CSSUnit, CSSName }}>
                            <SuggestionsProvider resolver={(word, { code, position }) => {
                                console.log(word, position)
                                // Logic: If we are after a colon, suggest values for that property
                                const allBefore = code.slice(0, position);
                                const lastColon = allBefore.lastIndexOf(':');
                                const lastSemicolon = allBefore.lastIndexOf(';');
                                const lastNewline = allBefore.lastIndexOf('\n');
                                const textLastLine = allBefore.slice(Math.max(lastSemicolon, lastNewline) + 1, position).trim()
                                const [prop, value] = textLastLine.split(':')

                                if (!prop) return []
                                if (lastColon > lastSemicolon && lastColon > lastNewline) {
                                    // We are in a value position
                                    const propertyName = allBefore.slice(Math.max(lastSemicolon, lastNewline) + 1, lastColon).trim();
                                    const values = CSS_VALUES[propertyName] || [];
                                    const exactValue = values.find(v => v === String(value).trim().toLowerCase());
                                    if (exactValue) return []
                                    return values.filter(v => v.startsWith(word.toLowerCase()));
                                }

                                // Otherwise suggest properties (default behavior)
                                // We can return empty to use default, but here we'll just implement a simple one
                                const props = ['color', 'background', 'border', 'display', 'position', 'width', 'height', 'margin', 'padding'];
                                return props.filter(p => p.startsWith(word.toLowerCase()));
                            }}>
                                <Shell />
                            </SuggestionsProvider>
                        </WidgetsProvider>
                    </MyParser>
                </Editor>
            </div>
        </div>
    )
}

export default App
