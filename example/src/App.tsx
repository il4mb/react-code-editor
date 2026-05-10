import {
  Editor,
  Shell,
  WidgetsProvider,
  SuggestionsProvider,
  DiagnosticsProvider,
  Diagnostic,
  HighlighterProvider,
  createRegexHighlighter,
} from "@il4mb/rce";
import {
  ColorWidget,
  CSSName,
  NumberWidget,
  UnitWidget,
  BooleanWidget,
  NullWidget,
  FunctionWidget,
  ObjectWidget,
} from "@il4mb/rce/widgets";
import { useState, useMemo, useCallback } from "react";

const CSS_VALUES: Record<string, string[]> = {
  display: ["block", "flex", "grid", "inline", "inline-block", "none"],
  position: ["absolute", "fixed", "relative", "static", "sticky"],
  color: ["red", "blue", "green", "yellow", "black", "white", "transparent"],
  border: ["1px solid black", "2px dashed red", "none"],
  width: ["100%", "50%", "auto"],
  height: ["100%", "50%", "auto"],
};

const JS_KEYWORDS = [
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "import",
  "export",
  "class",
  "extends",
  "true",
  "false",
  "null",
  "undefined",
  "async",
  "await",
];

function App() {
  const [mode, setMode] = useState<"css" | "js">("css");
  const [style, setStyle] = useState<Record<string, string>>({});
  const [jsOutput, setJsOutput] = useState<string>("");

  const handleCssChange = useCallback((code: string) => {
    console.log("CSS Code Changed:", code);
    const records: [string, string][] = [];
    for (let line of code.split("\n")) {
      const [prop, value] = line.split(":");
      if (prop && value) {
        records.push([prop.trim(), value.trim()]);
      }
    }
    setStyle(Object.fromEntries(records));
  }, []);

  const handleJsChange = useCallback((code: string) => {
    setJsOutput(`// Live JS Output:\n${code}`);
  }, []);

  const cssValidator = useCallback((code: string) => {
    const diagnostics: Diagnostic[] = [];
    const lines = code.split("\n");
    let currentPos = 0;
    const knownProps = [
      "color",
      "background",
      "border",
      "display",
      "position",
      "width",
      "height",
      "margin",
      "padding",
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("//")) {
        if (!line.includes(":")) {
          diagnostics.push({
            range: [currentPos, currentPos + line.length],
            message: "Missing colon (:) in property declaration",
            severity: "error",
          });
        } else {
          const [prop, value] = line.split(":");
          const p = prop.trim();
          if (p && !knownProps.includes(p)) {
            diagnostics.push({
              range: [
                currentPos + line.indexOf(prop),
                currentPos + line.indexOf(prop) + prop.length,
              ],
              message: `Unknown property: ${p}`,
              severity: "warning",
            });
          }
        }
      }
      currentPos += line.length + 1;
    }
    return diagnostics;
  }, []);

  const jsValidator = useCallback((code: string) => {
    const diagnostics: Diagnostic[] = [];
    const lines = code.split("\n");
    let pos = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.endsWith(";") &&
        !trimmed.endsWith("{") &&
        !trimmed.endsWith("}") &&
        !trimmed.startsWith("//")
      ) {
        diagnostics.push({
          range: [pos + line.length - 1, pos + line.length],
          message: "Missing semicolon (;)",
          severity: "info",
        });
      }
      pos += line.length + 1;
    }
    return diagnostics;
  }, []);

  const cssResolver = useCallback(
    (word: string, { code, position }: { code: string; position: number }) => {
      const allBefore = code.slice(0, position);
      const lastColon = allBefore.lastIndexOf(":");
      const lastNewline = allBefore.lastIndexOf("\n");

      if (lastColon > lastNewline) {
        const propName = allBefore.slice(lastNewline + 1, lastColon).trim();
        const values = CSS_VALUES[propName] || [];
        return values.filter((v) => v.startsWith(word.toLowerCase()));
      }
      const props = [
        "color",
        "background",
        "border",
        "display",
        "position",
        "width",
        "height",
        "margin",
        "padding",
      ];
      return props.filter((p) => p.startsWith(word.toLowerCase()));
    },
    [],
  );

  const jsResolver = useCallback((word: string) => {
    if (!word) return [];
    return JS_KEYWORDS.filter((k) => k.startsWith(word.toLowerCase()));
  }, []);

  const cssWidgets = useMemo(
    () => ({
      ColorWidget,
      NumberWidget,
      UnitWidget,
      CSSName,
    }),
    [],
  );

  const jsWidgets = useMemo(
    () => ({
      BooleanWidget,
      NullWidget,
      FunctionWidget,
      ObjectWidget,
      ColorWidget,
      NumberWidget,
    }),
    [],
  );

  const cssHighlighter = useMemo(
    () =>
      createRegexHighlighter([
        { regex: /^\s*[^:]+/gm, color: "#9cdcfe" }, // Properties
        { regex: /:\s*[^;\n]+/g, color: "#ce9178" }, // Values
        { regex: /\/\/.*/g, color: "#6a9955" }, // Comments
      ]),
    [],
  );

  const jsHighlighter = useMemo(
    () =>
      createRegexHighlighter([
        {
          regex:
            /\b(const|let|var|function|return|if|else|for|while|import|export|class|extends|async|await)\b/g,
          color: "#569cd6",
        },
        { regex: /(['"`])(.*?)\1/g, color: "#ce9178" },
        { regex: /\b\d+(\.\d+)?\b/g, color: "#b5cea8" },
        { regex: /\b(console|window|document)\b/g, color: "#4ec9b0" },
        { regex: /\/\/.*/g, color: "#6a9955" },
      ]),
    [],
  );

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
            background: "linear-gradient(45deg, #4fc1ff, #a277ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          React Code Editor
        </h1>
        <p style={{ color: "#888" }}>
          Premium React code editor with real-time validation & widgets
        </p>
      </header>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setMode("css")}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: mode === "css" ? "#4fc1ff" : "#252525",
            color: mode === "css" ? "#000" : "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          CSS Editor
        </button>
        <button
          onClick={() => setMode("js")}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: mode === "js" ? "#a277ff" : "#252525",
            color: mode === "js" ? "#000" : "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          JS Editor
        </button>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: "bold",
              color: "#4fc1ff",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Source Code
          </div>
          <div
            style={{
              border: "1px solid #333",
              borderRadius: "12px",
              overflow: "hidden",
              height: "500px",
            }}
          >
            {mode === "css" ? (
              <Editor
                key="css-editor"
                initialValue={"border: 2px dashed rgba(255,0,0,0.5)"}
                onChange={handleCssChange}
              >
                <HighlighterProvider highlighter={cssHighlighter}>
                  <DiagnosticsProvider validator={cssValidator}>
                    <WidgetsProvider widgets={cssWidgets}>
                      <SuggestionsProvider resolver={cssResolver}>
                        <Shell />
                      </SuggestionsProvider>
                    </WidgetsProvider>
                  </DiagnosticsProvider>
                </HighlighterProvider>
              </Editor>
            ) : (
              <Editor
                key="js-editor"
                initialValue={
                  'function greet(name) {\n    return "Hello, " + name;\n}\n\nconst user = "Coder";\ngreet(user)'
                }
                onChange={handleJsChange}
              >
                <HighlighterProvider highlighter={jsHighlighter}>
                  <DiagnosticsProvider validator={jsValidator}>
                    <WidgetsProvider widgets={jsWidgets}>
                      <SuggestionsProvider resolver={jsResolver}>
                        <Shell />
                      </SuggestionsProvider>
                    </WidgetsProvider>
                  </DiagnosticsProvider>
                </HighlighterProvider>
              </Editor>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: "bold",
              color: mode === "css" ? "#4fc1ff" : "#a277ff",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {mode === "css" ? "Visual Preview" : "Execution Log"}
          </div>
          <div
            style={{
              border: "1px solid #333",
              borderRadius: "12px",
              backgroundColor: "#1a1a1a",
              height: "500px",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "auto",
            }}
          >
            {mode === "css" ? (
              <div
                style={{
                  ...style,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: style.color || "#4fc1ff",
                  borderRadius: "12px",
                  background: style.background || "rgba(255,255,255,0.05)",
                  border: style.border || "1px solid #333",
                  width: style.width || "200px",
                  height: style.height || "200px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  textAlign: "center",
                  padding: "1rem",
                }}
              >
                Visual Output
              </div>
            ) : (
              <div style={{ alignSelf: "stretch", width: "100%" }}>
                <div
                  style={{
                    color: "#888",
                    fontSize: "0.8rem",
                    marginBottom: "0.5rem",
                    fontFamily: "monospace",
                  }}
                >
                  $ node runner.js
                </div>
                <pre
                  style={{
                    margin: 0,
                    color: "#a277ff",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {jsOutput}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer
        style={{
          marginTop: "3rem",
          textAlign: "center",
          color: "#555",
          fontSize: "0.8rem",
        }}
      >
        &copy; 2026 Antigravity Editor - Built with React & Pure CSS
      </footer>
    </div>
  );
}

export default App;
