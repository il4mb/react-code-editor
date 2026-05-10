import { Editor, Shell, useEditor, WidgetsProvider, SuggestionsProvider, DiagnosticsProvider } from '@il4mb/rce'
import { ColorWidget, CSSName, CSSUnit, NumberWidget } from '@il4mb/rce/widgets'
import { Diagnostic } from '@il4mb/rce/type';
import { useEffect, useState } from 'react';




const CSS_VALUES: Record<string, string[]> = {
    'display': ['block', 'flex', 'grid', 'inline', 'inline-block', 'none'],
    'position': ['absolute', 'fixed', 'relative', 'static', 'sticky'],
    'color': ['red', 'blue', 'green', 'yellow', 'black', 'white', 'transparent'],
    'border': ['1px solid black', '2px dashed red', 'none']
}

function App() {
    const [style, setStyle] = useState<Record<string, string>>({})

    const handleCodeChange = (code: string) => {
        const records: [string, string][] = []
        for (let line of code.split("\n")) {
            const partOfLine = line.split(":")
            const key = String(partOfLine[0]).trim()
            const value = String(partOfLine[1]).trim()
            if (!key) continue;
            records.push([key, value])
        }
        setStyle(Object.fromEntries(records));
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1>React Code Editor Test</h1>
            <div style={{ padding: 10, border: '1px solid #333', marginBottom: 10 }}>
                <div style={style}>
                    Hallo World
                </div>
            </div>
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', height: '400px', padding: 10 }}>

                <Editor 
                    initialValue="color:#f00
border:30px
height:30px"
                    onChange={handleCodeChange}
                >
                    <DiagnosticsProvider validator={(code) => {
                        const diagnostics: Diagnostic[] = [];
                        const lines = code.split('\n');
                        let currentPos = 0;
                        const knownProps = ['color', 'background', 'border', 'display', 'position', 'width', 'height', 'margin', 'padding'];

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (trimmedLine) {
                                if (!line.includes(':')) {
                                    diagnostics.push({
                                        range: [currentPos, currentPos + line.length],
                                        message: "Missing colon in property declaration",
                                        severity: 'error'
                                    });
                                } else {
                                    const [prop, value] = line.split(':');
                                    const trimmedProp = prop.trim();
                                    if (trimmedProp && !knownProps.includes(trimmedProp)) {
                                        diagnostics.push({
                                            range: [currentPos + line.indexOf(prop), currentPos + line.indexOf(prop) + prop.length],
                                            message: `Unknown property: ${trimmedProp}`,
                                            severity: 'warning'
                                        });
                                    }
                                    if (value) {
                                        const trimmedValue = value.trim();
                                        const values = CSS_VALUES[trimmedProp] || [];
                                        const exactValue = values.find(v => v === trimmedValue.toLowerCase());
                                        if (!exactValue) {
                                            diagnostics.push({
                                                range: [currentPos + line.indexOf(value), currentPos + line.indexOf(value) + value.length],
                                                message: `Unknown value: ${trimmedValue}`,
                                                severity: 'warning'
                                            });
                                        }
                                    } else {
                                        diagnostics.push({
                                            range: [currentPos + (line.indexOf(':') + 1), currentPos + line.length],
                                            message: `Missing value`,
                                            severity: 'warning'
                                        });
                                    }
                                }
                            }
                            currentPos += line.length + 1;
                        }
                        return diagnostics;
                    }}>
                        <WidgetsProvider widgets={{ ColorWidget, NumberWidget, CSSUnit, CSSName }}>
                            <SuggestionsProvider resolver={(word, { code, position }) => {
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

                                // Otherwise suggest properties
                                const props = ['color', 'background', 'border', 'display', 'position', 'width', 'height', 'margin', 'padding'];
                                return props.filter(p => p.startsWith(word.toLowerCase()));
                            }}>
                                <Shell />
                            </SuggestionsProvider>
                        </WidgetsProvider>
                    </DiagnosticsProvider>
                </Editor>
            </div>
        </div>
    )
}

export default App
