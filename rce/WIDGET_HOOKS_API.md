# Widget Hooks API Reference

React Code Editor provides a robust set of hooks for building interactive custom widgets. These hooks handle state management, DOM interactions, and integration with the editor's token system.

## Overview

The widget hooks API consists of three core utilities:

- **`useWidgetToken(token)`** – Access and update widget token state with stable dispatch callbacks
- **`useWidgetDrag(options)`** – Implement document-level drag interactions with automatic cleanup
- **`sanitizeWidgetText(value)`** – Utility to strip newlines before token replacement

## `useWidgetToken(token)`

Provides direct access to editor state and dispatch for a specific token, with convenience methods for common widget interactions.

### Parameters

- **`token: Token`** – The token object from the widget component props

### Return Value

```typescript
{
  tokenRef: React.MutableRefObject<Token>
  text: string
  isActive: boolean
  isHovered: boolean
  setText: (newText: string) => void
  setActive: () => void
  clearActive: () => void
  setHovered: () => void
  clearHovered: () => void
}
```

### Properties & Methods

| Member | Type | Description |
|--------|------|-------------|
| `tokenRef` | `MutableRefObject<Token>` | Reference to the current token (kept in sync automatically). Use in event handlers to avoid stale closures. |
| `text` | `string` | Current text value of the token from editor state. |
| `isActive` | `boolean` | Whether this token is currently the active token (e.g., being edited). |
| `isHovered` | `boolean` | Whether this token is currently hovered by the user. |
| `setText(newText)` | `(newText: string) => void` | Update the token's text in the editor. Text is automatically sanitized (newlines stripped). |
| `setActive()` | `() => void` | Mark this token as the active token in editor state. |
| `clearActive()` | `() => void` | Remove active status from this token. |
| `setHovered()` | `() => void` | Mark this token as hovered. |
| `clearHovered()` | `() => void` | Remove hovered status from this token. |

### Example: Basic Usage

```typescript
import { useWidgetToken } from "react-code-editor"

export const MyWidget: WidgetComponent = ({ children, token }) => {
  const { text, setText, isActive } = useWidgetToken(token)
  
  const handleChange = (newValue: string) => {
    setText(newValue)
  }
  
  return (
    <span style={{ opacity: isActive ? 1 : 0.7 }}>
      {text} – {children}
    </span>
  )
}
```

### Key Patterns

**Avoiding stale closures**: The hook provides `tokenRef` so you can safely access the current token in event handlers:

```typescript
const { tokenRef, setText } = useWidgetToken(token)

const handleClick = (e: React.MouseEvent) => {
  // Use tokenRef.current to get the latest token
  console.log("Clicked token:", tokenRef.current.id)
  setText("new value")
}
```

**State-to-UI synchronization**: The `isActive` and `isHovered` flags are derived from global editor state, so your widget automatically reflects editor interactions:

```typescript
const { isActive, isHovered } = useWidgetToken(token)

return (
  <div style={{
    backgroundColor: isActive ? "blue" : isHovered ? "lightblue" : "white"
  }}>
    {/* Widget content */}
  </div>
)
```

---

## `useWidgetDrag(options)`

Manages document-level drag interactions with automatic event listener cleanup, cursor management, and delta calculations.

### Parameters

```typescript
type UseWidgetDragOptions = {
  cursor?: string                                       // CSS cursor during drag (default: "ew-resize")
  onStart?: (event: React.MouseEvent<HTMLElement>) => void
  onMove: (args: DragMoveArgs) => void
  onEnd?: () => void
}

type DragMoveArgs = {
  event: MouseEvent                                     // Native mouse event
  deltaX: number                                        // Total X movement since drag start
  deltaY: number                                        // Total Y movement since drag start
}
```

### Return Value

```typescript
{
  dragging: boolean                                     // Whether currently dragging
  onMouseDown: (event: React.MouseEvent<HTMLElement>) => void  // Attach to your drag handle
}
```

### Example: Number Slider

```typescript
import { useWidgetDrag, useWidgetToken } from "react-code-editor"

export const NumberWidget: WidgetComponent = ({ token }) => {
  const { text, setText, setActive, clearActive } = useWidgetToken(token)
  
  const { dragging, onMouseDown } = useWidgetDrag({
    cursor: "ew-resize",
    onStart: () => {
      setActive()
    },
    onMove: ({ deltaX }) => {
      const currentValue = parseFloat(text) || 0
      const newValue = currentValue + deltaX * 0.1  // 0.1 per pixel
      setText(newValue.toString())
    },
    onEnd: () => {
      clearActive()
    }
  })
  
  return (
    <div
      onMouseDown={onMouseDown}
      style={{ cursor: dragging ? "ew-resize" : "default" }}
    >
      {text}
    </div>
  )
}
```

### Important Behaviors

- **Single primary button**: Only left-click (button 0) initiates drag. Right-click and middle-click are ignored.
- **Automatic cleanup**: All event listeners are cleaned up on unmount and drag end.
- **Default cursor**: If `cursor` is not specified, defaults to `"ew-resize"`. Set to `""` to disable cursor changes.
- **Non-blocking**: The drag handler calls `preventDefault()` to prevent text selection during drag.

### Local State Pattern

For smooth, interactive feedback during drags, combine `useWidgetDrag` with local component state:

```typescript
const [localValue, setLocalValue] = useState("")

const { dragging, onMouseDown } = useWidgetDrag({
  onStart: () => {
    setLocalValue(text)
  },
  onMove: ({ deltaX }) => {
    const newValue = calculateNewValue(deltaX)
    setLocalValue(newValue)      // Update UI immediately
    setText(newValue)             // Sync to editor state
  },
  onEnd: () => {
    // Optionally finalize or revert
  }
})

return (
  <div onMouseDown={onMouseDown}>
    {dragging ? localValue : text}  {/* Show local value during drag */}
  </div>
)
```

---

## `sanitizeWidgetText(value)`

Removes newline characters from a string before inserting into the editor. Newlines are automatically stripped by `setText()`, but you can call this explicitly if needed.

### Parameters

- **`value: string`** – Any text string

### Return Value

- **`string`** – The input with all `\r` and `\n` characters removed

### Example

```typescript
const userInput = "123\n456"
const sanitized = sanitizeWidgetText(userInput)  // "123456"
```

---

## Integration with Editor State

All widget hooks interact with the global editor state through the `useEditor()` hook. When you call `setText()`, `setActive()`, etc., the editor state is updated atomically:

1. The token's text is replaced in the code
2. The entire document is re-tokenized
3. All widgets are reconciled with their new token IDs
4. UI updates trigger based on the new state

This ensures consistency across the editor and prevents desynchronization bugs.

---

## TypeScript Types

```typescript
import { Token, WidgetComponent, WidgetComponentProps } from "react-code-editor"

// A widget component receives these props
type WidgetComponentProps = {
  children: React.ReactNode
  token: Token
  renderDecorator?: (decorator: string) => React.ReactNode
}

// Widgets are typed as function components
type WidgetComponent = React.FC<WidgetComponentProps> & {
  widget: {
    tokenizer: (code: string) => Range[]
  }
}

// Token structure (read-only in widgets)
type Token = {
  id: string                 // Stable identifier
  text: string              // Current text value
  start: number            // Position in code
  end: number              // Position in code
}
```

---

## Best Practices

### 1. Always use `tokenRef` in event handlers

```typescript
// ❌ Wrong – stale closure
const handleChange = () => {
  setText(token.text + "!")  // May be out of date
}

// ✅ Right – fresh token reference
const { tokenRef, setText } = useWidgetToken(token)
const handleChange = () => {
  setText(tokenRef.current.text + "!")
}
```

### 2. Dispatch before UI updates during drag

```typescript
// ❌ Wrong – UI may lag behind editor state
const { onMouseDown } = useWidgetDrag({
  onMove: ({ deltaX }) => {
    setLocalValue(calculateNewValue(deltaX))  // UI update only
  }
})

// ✅ Right – UI and editor stay in sync
const { onMouseDown } = useWidgetDrag({
  onMove: ({ deltaX }) => {
    const newValue = calculateNewValue(deltaX)
    setText(newValue)                           // Editor state first
    setLocalValue(newValue)                     // UI update
  }
})
```

### 3. Use `isActive` and `isHovered` for visual feedback

```typescript
const { isActive, isHovered } = useWidgetToken(token)

return (
  <div style={{
    opacity: isActive ? 1 : 0.6,
    backgroundColor: isHovered ? "#f0f0f0" : "transparent"
  }}>
    {children}
  </div>
)
```

### 4. Clean up drag state in `onEnd`

```typescript
const { onMouseDown } = useWidgetDrag({
  onEnd: () => {
    setLocalValue("")        // Reset temporary state
    clearActive()            // Update editor state
  }
})
```

---

## Migration from Direct Dispatch

If you have existing widgets using `useEditor()` directly:

```typescript
// ❌ Old pattern
const { dispatch } = useEditor()
const handleChange = (newValue) => {
  dispatch({ type: "SET_TOKEN_TEXT", ... })
  dispatch({ type: "SET_ACTIVE_TOKEN", ... })
}

// ✅ New pattern
const { setText, setActive } = useWidgetToken(token)
const handleChange = (newValue) => {
  setText(newValue)
  setActive()
}
```

The hooks provide the same functionality with less boilerplate and better type safety.

---

## Troubleshooting

**Widget doesn't update when token changes**
- Ensure you're reading from `text` property of the hook return, not the `token` prop directly
- Check that `setText()` is being called with the correct new value

**Drag feels jerky or laggy**
- Verify `onMove` is updating both editor state (`setText`) and local state (`setLocalValue`) synchronously
- Use `useRef` for non-rendering state to avoid re-renders during drag

**Multiple dragging widgets interfere**
- Each widget should have its own `useWidgetDrag` instance
- Ensure `onEnd` properly cleans up local state

**Newlines appearing in token text**
- Call `sanitizeWidgetText()` on user input before `setText()`
- Or rely on automatic sanitization in `setText()`

---

## See Also

- [Custom Widgets Guide](./CUSTOM_WIDGETS_GUIDE.md) – Step-by-step examples of building complete widgets
- [Architecture Reference](./rce_architecture_summary.md) – Deep dive into rendering and reconciliation
