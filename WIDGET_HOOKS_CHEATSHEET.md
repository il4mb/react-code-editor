# Widget Hooks Cheat Sheet

Quick reference for the most common widget hook patterns.

## `useWidgetToken(token)` 

**Read current state:**
```typescript
const { text, isActive, isHovered } = useWidgetToken(token)
```

**Update token text:**
```typescript
const { setText } = useWidgetToken(token)
setText("new value")  // Automatically sanitized
```

**Manage active state:**
```typescript
const { setActive, clearActive, isActive } = useWidgetToken(token)
```

**Manage hover state:**
```typescript
const { setHovered, clearHovered, isHovered } = useWidgetToken(token)
```

**Safe event handler (avoid stale closures):**
```typescript
const { tokenRef, setText } = useWidgetToken(token)

const handleClick = () => {
  console.log(tokenRef.current.id)  // ✅ Fresh reference
  setText("updated")
}
```

---

## `useWidgetDrag(options)`

**Basic drag:**
```typescript
const { dragging, onMouseDown } = useWidgetDrag({
  onMove: ({ deltaX, deltaY }) => {
    // Handle drag movement
  }
})

return <div onMouseDown={onMouseDown}>Drag me</div>
```

**With lifecycle hooks:**
```typescript
const { dragging, onMouseDown } = useWidgetDrag({
  onStart: (event) => console.log("Drag started"),
  onMove: ({ deltaX }) => {
    const newValue = initialValue + deltaX * 0.5
  },
  onEnd: () => console.log("Drag ended")
})
```

**Custom cursor:**
```typescript
const { onMouseDown } = useWidgetDrag({
  cursor: "grab",  // Default: "ew-resize"
  onMove: ({ deltaX }) => { /* ... */ }
})
```

**Number drag pattern (local + global sync):**
```typescript
const { text, setText, setActive, clearActive } = useWidgetToken(token)
const [localValue, setLocalValue] = useState(text)

const { dragging, onMouseDown } = useWidgetDrag({
  onStart: () => {
    setActive()
  },
  onMove: ({ deltaX }) => {
    const newValue = Math.round(parseFloat(text) + deltaX)
    setLocalValue(newValue.toString())
    setText(newValue.toString())  // ← Sync immediately
  },
  onEnd: () => {
    clearActive()
  }
})

return (
  <div onMouseDown={onMouseDown}>
    {dragging ? localValue : text}  {/* ← Show local during drag */}
  </div>
)
```

---

## `sanitizeWidgetText(value)`

Remove newlines before inserting text:

```typescript
import { sanitizeWidgetText } from "react-code-editor"

const userInput = "line1\nline2"
const clean = sanitizeWidgetText(userInput)  // "line1line2"

setText(clean)
```

Or rely on automatic sanitization:
```typescript
const { setText } = useWidgetToken(token)
setText(userInput)  // Newlines automatically stripped
```

---

## Complete Widget Template

```typescript
import { WidgetComponent, useWidgetToken, useWidgetDrag } from "react-code-editor"
import { styled } from "@mui/system"
import { useRef, useState } from "react"

// 1. Define tokenizer
function myTokenizer(code: string) {
  const ranges = []
  const regex = /your-pattern-here/g
  let match
  while ((match = regex.exec(code)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length })
  }
  return ranges
}

// 2. Define styled component
const MyWidgetBadge = styled("span")({
  cursor: "pointer",
  padding: "2px 4px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "3px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.2)"
  }
})

// 3. Create component
const MyWidget: WidgetComponent = ({ children, token, renderDecorator }) => {
  const { text, setText, setActive, clearActive } = useWidgetToken(token)
  const [localValue, setLocalValue] = useState("")
  
  const { dragging, onMouseDown } = useWidgetDrag({
    onStart: () => {
      setLocalValue(text)
      setActive()
    },
    onMove: ({ deltaX }) => {
      const newValue = calculateNewValue(text, deltaX)
      setLocalValue(newValue)
      setText(newValue)
    },
    onEnd: () => {
      clearActive()
    }
  })
  
  return (
    <MyWidgetBadge
      onMouseDown={onMouseDown}
      title="Drag to adjust"
    >
      {dragging ? localValue : text}
    </MyWidgetBadge>
  )
}

// 4. Attach tokenizer
MyWidget.widget = { tokenizer: myTokenizer }

// 5. Export
export default MyWidget
```

---

## Common Patterns

### Pattern: Numeric Input with Units
```typescript
const parseNumber = (text: string) => {
  const match = text.match(/^([\d.-]+)(.*)$/)
  return [parseFloat(match?.[1] || "0"), match?.[2] || ""]
}

const rebuildNumber = (num: number, unit: string) => num + unit

const handleDrag = ({ deltaX }) => {
  const [num, unit] = parseNumber(text)
  const newNum = num + deltaX * 0.1
  setText(rebuildNumber(newNum, unit))
}
```

### Pattern: Color Conversion
```typescript
const hexToRgb = (hex: string) => {
  const num = parseInt(hex.slice(1), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgb(${r}, ${g}, ${b})`
}

const cssToHex = (color: string) => {
  if (color.startsWith("#")) return color
  const match = color.match(/\d+/g)
  if (!match) return "#000000"
  const [r, g, b] = match.slice(0, 3).map(x => parseInt(x))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}
```

### Pattern: Prevent Stale Closures
```typescript
const { tokenRef, setText } = useWidgetToken(token)

// ❌ DON'T: Use token prop directly
const handleClick = () => {
  console.log(token.id)  // May be stale!
}

// ✅ DO: Use tokenRef
const handleClick = () => {
  console.log(tokenRef.current.id)  // Always fresh
}
```

### Pattern: Async Validation
```typescript
const { setText } = useWidgetToken(token)
const [error, setError] = useState("")

const handleChange = async (newValue: string) => {
  try {
    const isValid = await validateValue(newValue)
    if (!isValid) {
      setError("Invalid value")
      return
    }
    setText(newValue)
    setError("")
  } catch (e) {
    setError(e instanceof Error ? e.message : "Error")
  }
}
```

---

## Debugging Checklist

- [ ] Token text updating but not showing?
  - Check that you're reading `text` from hook, not `token.text` prop
  
- [ ] Drag feeling jerky?
  - Verify you're updating both `setLocalValue` and `setText` in `onMove`
  
- [ ] "Stale closure" errors in console?
  - Use `tokenRef.current` instead of `token` in event handlers
  
- [ ] Newlines appearing in code?
  - Ensure input is passed through `sanitizeWidgetText()` or hook auto-sanitizes
  
- [ ] Widget position jumping during edit?
  - Check that tokenizer matches intended ranges only
  - Use `start:end` to debug token boundaries

---

## API Quick Reference

| Hook | Returns | Key Methods |
|------|---------|-------------|
| `useWidgetToken(token)` | Object | `setText()`, `setActive()`, `setHovered()`, `tokenRef` |
| `useWidgetDrag(opts)` | Object | `onMouseDown`, `dragging` |
| `sanitizeWidgetText(value)` | string | N/A (pure function) |

---

## Minimal Example (Copy & Paste)

```typescript
import { WidgetComponent, useWidgetToken } from "react-code-editor"

const SimpleWidget: WidgetComponent = ({ children, token }) => {
  const { text, setText } = useWidgetToken(token)
  return (
    <button onClick={() => setText("clicked")}>
      {text}
    </button>
  )
}

SimpleWidget.widget = {
  tokenizer: (code) => {
    const ranges = []
    const regex = /test/g
    let m
    while ((m = regex.exec(code)) !== null) {
      ranges.push({ start: m.index, end: m.index + 4 })
    }
    return ranges
  }
}

export default SimpleWidget
```

---

See **[WIDGET_HOOKS_API.md](./WIDGET_HOOKS_API.md)** for complete documentation.
