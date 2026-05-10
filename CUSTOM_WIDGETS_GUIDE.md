# Custom Widgets Guide

This guide walks you through building interactive custom widgets for React Code Editor (RCE). Whether you're creating a simple value display or a complex interactive component, these patterns will help you build robust, performant widgets.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Anatomy of a Widget](#anatomy-of-a-widget)
3. [Example: Color Picker Widget](#example-color-picker-widget)
4. [Example: Number Slider Widget](#example-number-slider-widget)
5. [Advanced Patterns](#advanced-patterns)
6. [Common Pitfalls](#common-pitfalls)

---

## Quick Start

### 1. Define Your Widget Tokenizer

A tokenizer identifies ranges in code that your widget should decorate.

```typescript
// Match CSS color values: rgb(r, g, b), rgba(r, g, b, a), #hex
function colorTokenizer(code: string): Range[] {
  const ranges: Range[] = []
  const colorRegex = /(rgb|rgba)\([^)]+\)|(#[0-9a-f]{3,6})/gi
  
  let match
  while ((match = colorRegex.exec(code)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  return ranges
}
```

### 2. Create Your Widget Component

```typescript
import { WidgetComponent } from "react-code-editor"
import { useWidgetToken } from "react-code-editor"

const MyColorWidget: WidgetComponent = ({ children, token }) => {
  const { text, setText } = useWidgetToken(token)
  
  const handleColorChange = (color: string) => {
    setText(color)
  }
  
  return (
    <button
      onClick={() => {
        const color = prompt("Enter color:", text)
        if (color) handleColorChange(color)
      }}
    >
      🎨
    </button>
  )
}

// Attach the tokenizer metadata
MyColorWidget.widget = {
  tokenizer: colorTokenizer
}

export default MyColorWidget
```

### 3. Register in Your Editor

```typescript
import { Editor, useWidgets } from "react-code-editor"
import MyColorWidget from "./MyColorWidget"

export function MyEditor() {
  const widgets = useWidgets([MyColorWidget])
  
  return (
    <Editor
      initialCode="background: rgb(255, 0, 0);"
      widgets={widgets}
    />
  )
}
```

---

## Anatomy of a Widget

Every widget has three key parts:

### 1. **The Tokenizer Function**

Identifies matching ranges in the code. Called when code changes to find all occurrences of your token type.

```typescript
type Tokenizer = (code: string) => Range[]

// Simple regex-based example
function numberTokenizer(code: string): Range[] {
  const ranges: Range[] = []
  const numberRegex = /\d+/g
  
  let match
  while ((match = numberRegex.exec(code)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  return ranges
}
```

### 2. **The Widget Component**

A React component that renders the interactive UI. Receives:
- `token` – Current token object with `id`, `text`, `start`, `end`
- `children` – The original token text (rendered by default)
- `renderDecorator` – Function to render inline decorators (badges, icons, etc.)

```typescript
const MyWidget: WidgetComponent = ({ children, token, renderDecorator }) => {
  const { text, setText, isActive } = useWidgetToken(token)
  
  return (
    <span style={{ opacity: isActive ? 1 : 0.7 }}>
      {renderDecorator && renderDecorator("🔧")}
      {children}
    </span>
  )
}
```

### 3. **Widget Metadata**

Attached as a static property on the component:

```typescript
MyWidget.widget = {
  tokenizer: myTokenizer
}
```

---

## Example: Color Picker Widget

A practical example of an interactive color widget.

```typescript
import { WidgetComponent } from "react-code-editor"
import { useWidgetToken } from "react-code-editor"
import { styled } from "@mui/system"

// Tokenizer: find CSS color values
function colorTokenizer(code: string): Range[] {
  const ranges: Range[] = []
  const colorRegex = /(rgb|rgba)\([^)]+\)|(#[0-9a-f]{3,6})/gi
  
  let match
  while ((match = colorRegex.exec(code)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  return ranges
}

// Helper: convert CSS color to hex
function cssToHex(color: string): string {
  if (color.startsWith("#")) return color
  
  const match = color.match(/\d+/g)
  if (!match || match.length < 3) return "#000000"
  
  const [r, g, b] = match.slice(0, 3).map(x => parseInt(x))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

// Helper: convert hex to rgb
function hexToRgb(hex: string): string {
  const num = parseInt(hex.slice(1), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgb(${r}, ${g}, ${b})`
}

// Styled components
const ColorBadge = styled("button")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  padding: 0,
  margin: "0 4px",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  borderRadius: "2px",
  cursor: "pointer",
  backgroundColor: "transparent",
  
  "&:hover": {
    borderColor: "rgba(255, 255, 255, 0.5)"
  },
  
  "&:focus": {
    outline: "2px solid #4fc1ff",
    outlineOffset: "1px"
  }
})

const ColorSwatch = styled("div")({
  width: "14px",
  height: "14px",
  borderRadius: "1px"
})

// The widget component
export const ColorWidget: WidgetComponent = ({ children, token, renderDecorator }) => {
  const { text, setText, isActive } = useWidgetToken(token)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const handleColorClick = () => {
    // Show native color picker
    inputRef.current?.click()
  }
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    // Convert back to original format
    const newColor = text.startsWith("rgb") ? hexToRgb(hex) : hex
    setText(newColor)
  }
  
  const hex = cssToHex(text)
  
  return (
    <span style={{ opacity: isActive ? 0.8 : 1 }}>
      <ColorBadge onClick={handleColorClick} title={text}>
        <ColorSwatch style={{ backgroundColor: hex }} />
        <input
          ref={inputRef}
          type="color"
          value={hex}
          onChange={handleColorChange}
          style={{ display: "none" }}
        />
      </ColorBadge>
      {children}
    </span>
  )
}

ColorWidget.widget = {
  tokenizer: colorTokenizer
}

export default ColorWidget
```

**Key patterns:**

- **Tokenizer** uses regex to find CSS color patterns
- **Conversion helpers** (`cssToHex`, `hexToRgb`) handle format changes
- **Input hiding** – HTML5 `<input type="color">` is hidden and triggered by click
- **Format preservation** – Converts back to original format (rgb vs hex) before setting

---

## Example: Number Slider Widget

A draggable number editor with live visual feedback.

```typescript
import { WidgetComponent } from "react-code-editor"
import { useWidgetToken, useWidgetDrag } from "react-code-editor"
import { styled } from "@mui/system"
import { useRef, useState } from "react"

// Tokenizer: find floating-point and integer numbers
function numberTokenizer(code: string): Range[] {
  const ranges: Range[] = []
  const numberRegex = /[-+]?\d*\.?\d+/g
  
  let match
  while ((match = numberRegex.exec(code)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  return ranges
}

const NumberBadge = styled("span")({
  display: "inline-flex",
  padding: "0 4px",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "3px",
  fontSize: "10px",
  color: "#4fc1ff",
  cursor: "ew-resize",
  marginLeft: "4px",
  userSelect: "none",
  verticalAlign: "middle",
  
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.3)"
  }
})

export const NumberWidget: WidgetComponent = ({ children, token, renderDecorator }) => {
  const { text, setText, setActive, clearActive } = useWidgetToken(token)
  
  const [dragging, setDragging] = useState(false)
  const [localValue, setLocalValue] = useState(text)
  
  const initialVal = useRef(0)
  const initialUnit = useRef("")
  const localValueRef = useRef("")
  
  // Parse number and unit (e.g., "16px" → 16 + "px")
  const parseNumberAndUnit = (str: string) => {
    const match = str.match(/^([-+]?\d*\.?\d+)(.*)$/)
    if (!match) return [0, ""]
    return [parseFloat(match[1]) || 0, match[2] || ""]
  }
  
  const { dragging: isDragging, onMouseDown } = useWidgetDrag({
    cursor: "ew-resize",
    onStart: () => {
      const [num, unit] = parseNumberAndUnit(text)
      initialVal.current = num
      initialUnit.current = unit
      setDragging(true)
      setLocalValue(text)
      localValueRef.current = text
      setActive()
    },
    onMove: ({ deltaX }) => {
      let next = initialVal.current + deltaX * 0.1  // 0.1 per pixel
      
      // Preserve decimal places if original had them
      if (!text.includes(".")) {
        next = Math.round(next)
      } else {
        next = parseFloat(next.toFixed(2))
      }
      
      const nextText = next.toString() + initialUnit.current
      setLocalValue(nextText)
      localValueRef.current = nextText
      setText(nextText)
    },
    onEnd: () => {
      setDragging(false)
      clearActive()
    }
  })
  
  return (
    <span>
      <NumberBadge onMouseDown={onMouseDown} title="Drag to adjust">
        {isDragging || dragging ? localValue : text}
      </NumberBadge>
      {children}
    </span>
  )
}

NumberWidget.widget = {
  tokenizer: numberTokenizer
}

export default NumberWidget
```

**Key patterns:**

- **Parse & extract** – Separate number from unit before calculation
- **Preserve formatting** – Keep decimal places or integers based on original value
- **Local + global state** – `localValue` for immediate drag feedback, `setText()` for persistence
- **Smart delta** – Use `deltaX * 0.1` for reasonable adjustment sensitivity

---

## Advanced Patterns

### Pattern 1: Multi-Part Widgets

Some tokens span multiple values. Parse and update individual parts:

```typescript
// Widget for CSS shorthand: "10px 20px 30px 40px"
const parseShorthand = (text: string) => {
  return text.split(/\s+/).map(x => parseFloat(x) || 0)
}

const rebuildShorthand = (values: number[], units: string[]) => {
  return values.map((v, i) => v + units[i]).join(" ")
}

const ShorthandWidget: WidgetComponent = ({ token }) => {
  const { text, setText } = useWidgetToken(token)
  const values = parseShorthand(text)
  const units = text.split(/\d+/).filter(Boolean)
  
  const updateValue = (index: number, newValue: number) => {
    values[index] = newValue
    setText(rebuildShorthand(values, units))
  }
  
  return (
    <div>
      {values.map((v, i) => (
        <input
          key={i}
          type="number"
          value={v}
          onChange={(e) => updateValue(i, parseFloat(e.target.value) || 0)}
        />
      ))}
    </div>
  )
}
```

### Pattern 2: Conditional Rendering

Widgets can choose whether to show based on the token content:

```typescript
const SmartWidget: WidgetComponent = ({ children, token }) => {
  const { text } = useWidgetToken(token)
  
  // Only show for certain patterns
  if (!isValidFormat(text)) {
    return <>{children}</>  // Fallback to plain text
  }
  
  return (
    <InteractiveWidget>
      {children}
    </InteractiveWidget>
  )
}
```

### Pattern 3: Validation & Error Handling

```typescript
const ValidatedWidget: WidgetComponent = ({ token }) => {
  const { text, setText } = useWidgetToken(token)
  const [error, setError] = useState<string | null>(null)
  
  const handleChange = (newValue: string) => {
    try {
      if (!isValid(newValue)) {
        setError("Invalid format")
        return
      }
      setText(newValue)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    }
  }
  
  return (
    <div>
      <input onChange={(e) => handleChange(e.target.value)} />
      {error && <span style={{ color: "red" }}>{error}</span>}
    </div>
  )
}
```

### Pattern 4: Context-Aware Widgets

Access editor state for context:

```typescript
const ContextAwareWidget: WidgetComponent = ({ token }) => {
  const { state } = useEditor()
  const { text, setText } = useWidgetToken(token)
  
  // Use global editor state to make decisions
  const isDarkMode = state.theme === "dark"
  const isReadOnly = state.readOnly
  
  return (
    <div style={{
      color: isDarkMode ? "white" : "black",
      pointerEvents: isReadOnly ? "none" : "auto"
    }}>
      {text}
    </div>
  )
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Using Stale Token Directly

```typescript
// ❌ WRONG – token.text may be out of date
const Widget: WidgetComponent = ({ token }) => {
  const handleClick = () => {
    console.log(token.text)  // May be stale!
  }
}

// ✅ RIGHT – use the hook's text property
const Widget: WidgetComponent = ({ token }) => {
  const { text } = useWidgetToken(token)
  const handleClick = () => {
    console.log(text)  // Always fresh
  }
}
```

### ❌ Pitfall 2: Async/Debounced setText

```typescript
// ❌ WRONG – batching updates leads to desync
const Widget: WidgetComponent = ({ token }) => {
  const { setText } = useWidgetToken(token)
  
  const debouncedSet = debounce(setText, 500)  // Updates lag!
  
  const handleChange = (value) => {
    debouncedSet(value)  // UI ahead of editor state
  }
}

// ✅ RIGHT – dispatch immediately, debounce display if needed
const Widget: WidgetComponent = ({ token }) => {
  const { setText } = useWidgetToken(token)
  const [displayValue, setDisplayValue] = useState("")
  
  const handleChange = (value) => {
    setDisplayValue(value)      // Update UI immediately
    setText(value)              // Sync to editor right away
  }
}
```

### ❌ Pitfall 3: Tokenizer Performance

```typescript
// ❌ WRONG – regex executed on every code change
const tokenizer = (code: string) => {
  const regex = new RegExp(pattern)  // Created each call!
  // ... process
}

// ✅ RIGHT – compile regex once
const REGEX = new RegExp(pattern)
const tokenizer = (code: string) => {
  // ... use REGEX
}
```

### ❌ Pitfall 4: Missing Unit Handling

```typescript
// ❌ WRONG – loses units when updating
const handleDrag = ({ deltaX }) => {
  const num = parseFloat(text)
  setText((num + deltaX).toString())  // "16px" becomes "16"
}

// ✅ RIGHT – preserve units
const handleDrag = ({ deltaX }) => {
  const match = text.match(/^([\d.-]+)(.*)$/)
  const num = parseFloat(match?.[1] || "0")
  const unit = match?.[2] || ""
  setText((num + deltaX) + unit)  // "16px" becomes "17px"
}
```

### ❌ Pitfall 5: Newlines in Widget Output

```typescript
// ❌ WRONG – multiline text breaks token range
const handlePaste = (text) => {
  setText(text)  // May contain \n characters
}

// ✅ RIGHT – sanitize before setting
import { sanitizeWidgetText } from "react-code-editor"

const handlePaste = (text) => {
  setText(sanitizeWidgetText(text))  // Newlines removed
}
```

---

## Testing Your Widget

Use the example app to test your widget:

```typescript
// example/src/App.tsx
import MyCustomWidget from "../path/to/MyCustomWidget"

export default function App() {
  const widgets = useWidgets([MyCustomWidget])
  
  return (
    <Editor
      initialCode={`
        /* Test your widget here */
        color: rgb(255, 0, 0);
        margin: 16px;
      `}
      widgets={widgets}
    />
  )
}
```

Run the example app:

```bash
cd example
pnpm dev
```

---

## Debugging

Use browser DevTools to inspect:

1. **Token reconciliation**: Check that token IDs remain stable during edits (Console → `window.__DEBUG_TOKENS`)
2. **State updates**: Use React DevTools Profiler to verify `setText()` causes re-renders
3. **Drag events**: Add console logs in `onMove` to verify delta calculations

---

## See Also

- [Widget Hooks API Reference](./WIDGET_HOOKS_API.md) – Complete API documentation
- [Architecture Reference](./rce_architecture_summary.md) – How widgets integrate into rendering
- [Example Widgets](./rce/src/widgets/) – Built-in widget implementations
