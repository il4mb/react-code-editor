# React Code Editor (RCE)

A high-performance, widget-based code editor built with React. Perfect for building interactive code editing experiences with custom interactive decorators.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

## ✨ Features

- **🎨 Interactive Widgets** – Build custom decorators for code values (numbers, colors, functions, etc.)
- **⚡ High Performance** – Surgical rendering with memoization prevents layout jitter
- **🔄 Token Reconciliation** – Stable widget IDs across code changes prevent unmounting
- **💪 Rich Editor** – Selection, caret tracking, diagnostics, highlights, suggestions
- **📝 Syntax Agnostic** – Works with any language; you define the tokenizer
- **♿ Accessible** – contentEditable-based input, semantic HTML, keyboard support
- **🧪 Well Tested** – TypeScript strict mode, comprehensive widget hook API

## 🚀 Quick Start

### 1. Install

```bash
npm install @il4mb/rce
# or
pnpm add @il4mb/rce
```

### 2. Create a Widget

```typescript
import { WidgetComponent, useWidgetToken } from "@il4mb/rce"

// Define what code to match
function numberTokenizer(code: string) {
  const ranges = []
  const regex = /\d+/g
  let match
  while ((match = regex.exec(code)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length })
  }
  return ranges
}

// Create an interactive widget
const NumberWidget: WidgetComponent = ({ children, token }) => {
  const { text, setText } = useWidgetToken(token)

  return (
    <button onClick={() => {
      const n = prompt("New number:", text)
      if (n) setText(n)
    }}>
      {children}
    </button>
  )
}

// Attach the tokenizer
NumberWidget.widget = { tokenizer: numberTokenizer }

export default NumberWidget
```

### 3. Use in Editor

```typescript
import { Editor, useWidgets } from "@il4mb/rce"
import NumberWidget from "./NumberWidget"

export function MyEditor() {
  const widgets = useWidgets([NumberWidget])

  return (
    <Editor
      initialCode="The answer is 42"
      widgets={widgets}
    />
  )
}
```

## 📖 Documentation

Start with the right guide for your use case:

### For Widget Developers

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** – Navigation hub and learning paths
- **[WIDGET_HOOKS_API.md](./WIDGET_HOOKS_API.md)** – Complete API reference for `useWidgetToken()`, `useWidgetDrag()`
- **[CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md)** – Step-by-step examples and patterns
- **[WIDGET_HOOKS_CHEATSHEET.md](./WIDGET_HOOKS_CHEATSHEET.md)** – Quick lookup and copy-paste templates

### For Architecture Deep Dive

- **[rce_architecture_summary.md](./rce_architecture_summary.md)** – Surgical rendering, token reconciliation, DOM safety

### Tracking Changes

- **[CHANGELOG.md](./CHANGELOG.md)** – New widget hooks, bug fixes, migration guides

## 🎯 Core Concepts

### Tokenizers

A function that identifies patterns in code:

```typescript
type Tokenizer = (code: string) => Range[];
```

Example: Find all hex colors

```typescript
function colorTokenizer(code: string): Range[] {
  const ranges = [];
  const regex = /#[0-9a-f]{6}/gi;
  let match;
  while ((match = regex.exec(code)) !== null) {
    ranges.push({ start: match.index, end: match.index + 7 });
  }
  return ranges;
}
```

### Widget Hooks

High-level primitives for building interactive widgets:

**`useWidgetToken(token)`** – State and dispatch helpers

```typescript
const {
  text, // Current token text
  setText, // Update token
  isActive,
  isHovered, // UI state
  setActive,
  setHovered, // Manage state
} = useWidgetToken(token);
```

**`useWidgetDrag(options)`** – Document-level drag handling

```typescript
const { dragging, onMouseDown } = useWidgetDrag({
  onMove: ({ deltaX, deltaY }) => {
    // Update widget during drag
  },
});
```

### Architecture Highlights

1. **Surgical Rendering** – Only re-render changed tokens, never the whole DOM
2. **Token Reconciliation** – Tokens keep stable IDs across code changes, preventing widget unmounting
3. **Local Interaction Model** – Widgets update local state (UI) + global state (code) simultaneously for smooth drags
4. **Atomic Updates** – All token changes go through a single reducer for consistency
5. **DOM Safety** – Live DOM code extraction prevents stale-closure bugs in text handlers

See [rce_architecture_summary.md](./rce_architecture_summary.md) for details.

## 📦 Built-in Widgets

RCE includes example widgets you can use or extend:

| Widget                                                    | Purpose                       |
| --------------------------------------------------------- | ----------------------------- |
| [NumberWidget](./rce/src/widgets/NumberWidget.tsx)        | Draggable number editor       |
| [ColorWidget](./rce/src/widgets/ColorWidget.tsx)          | Color picker                  |
| [UnitWidget](./rce/src/widgets/UnitWidget.tsx)            | CSS unit editor with dropdown |
| [JSNumberWidget](./rce/src/widgets/JS/JSNumberWidget.tsx) | Number widget for JavaScript  |

## 🎨 Example Widgets in Docs

See complete implementations in [CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md):

- **Color Picker** – CSS color matching with native picker
- **Number Slider** – Draggable number with local + global sync
- Plus advanced patterns: validation, multi-part, context-aware

## 🔧 Usage

### Basic Editor

```typescript
import { Editor } from "@il4mb/rce"

export function App() {
  return (
    <Editor
      initialCode="const x = 42"
      onChange={(code) => console.log(code)}
    />
  )
}
```

### With Widgets

```typescript
import { Editor, useWidgets } from "@il4mb/rce"
import { NumberWidget, ColorWidget } from "@il4mb/rce/widgets"

export function App() {
  const widgets = useWidgets([NumberWidget, ColorWidget])

  return (
    <Editor
      initialCode="margin: 16px; color: rgb(255, 0, 0);"
      widgets={widgets}
    />
  )
}
```

### With Suggestions

```typescript
import { Editor, useSuggestionResolver } from "@il4mb/rce"

function suggestNumbers(code: string, position: number) {
  return [
    { label: "10", value: "10" },
    { label: "20", value: "20" },
    { label: "30", value: "30" }
  ]
}

export function App() {
  const suggestions = useSuggestionResolver(suggestNumbers)

  return (
    <Editor
      initialCode="margin: 16px"
      suggestions={suggestions}
    />
  )
}
```

## 🏗️ Project Structure

```
@il4mb/rce/
├── rce/                          # Main editor library
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── widgetHooks.ts   # useWidgetToken, useWidgetDrag
│   │   │   ├── useEditorHandler.ts
│   │   │   ├── useKeyboardActions.ts
│   │   │   └── ...
│   │   ├── widgets/              # Built-in widgets
│   │   │   ├── NumberWidget.tsx
│   │   │   ├── ColorWidget.tsx
│   │   │   └── ...
│   │   ├── cores/                # Core editor components
│   │   │   ├── Canvas.tsx        # Rendering engine
│   │   │   ├── reducer.ts        # State management
│   │   │   └── ...
│   │   ├── utils/                # Utilities
│   │   ├── types.ts              # Type definitions
│   │   └── index.ts              # Public API
│   └── package.json
├── example/                      # Demo application
│   ├── src/App.tsx
│   └── vite.config.ts
├── DOCUMENTATION.md              # Navigation hub
├── WIDGET_HOOKS_API.md           # API reference
├── CUSTOM_WIDGETS_GUIDE.md       # Examples & patterns
├── CHANGELOG.md                  # What changed
└── README.md                     # This file
```

## 💡 Widget Development Tips

### 1. Always Use Widget Hooks

```typescript
// ❌ Don't: Manual dispatch
const { dispatch } = useEditor();

// ✅ Do: Use widget hooks
const { setText, setActive } = useWidgetToken(token);
```

### 2. Avoid Stale Closures

```typescript
// ❌ Don't: Event handler with token prop
const handleClick = () => {
  console.log(token.id); // May be stale!
};

// ✅ Do: Use tokenRef
const { tokenRef } = useWidgetToken(token);
const handleClick = () => {
  console.log(tokenRef.current.id); // Always fresh
};
```

### 3. Sync Local + Global State During Drag

```typescript
// ❌ Don't: Only update local state
setLocalValue(newValue);

// ✅ Do: Update both for smooth interaction
setLocalValue(newValue); // Immediate UI feedback
setText(newValue); // Persist to editor
```

### 4. Sanitize Widget Output

```typescript
// ❌ Don't: Multiline text
setText(userInput);

// ✅ Do: Remove newlines
setText(sanitizeWidgetText(userInput));
// Or use hook which auto-sanitizes
```

See [CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md#common-pitfalls) for more.

## 🧪 Testing

### Development

```bash
cd rce
pnpm install
pnpm build
pnpm exec tsc --noEmit  # Type check
```

### Example App

```bash
cd example
pnpm install
pnpm dev
```

Navigate to `http://localhost:5173` to test widgets interactively.

## 📊 Performance

RCE is optimized for smooth interactions:

- **Surgical rendering:** Only changed tokens re-render (~2-5% of DOM)
- **Memoization:** `MemoizedToken` skips render if token ID + text unchanged
- **Stable IDs:** Token reconciliation prevents widget unmounting
- **Local state:** Drags update local state (60fps) while syncing to editor state

**Benchmarks (approximate):**

- 1,000 tokens: Smooth 60fps dragging
- 10,000 tokens: 30-40fps (acceptable, suggestions compute may slow)
- 100,000 tokens: May experience slowdown (optimize suggestion resolver)

Profile with React DevTools Profiler to identify bottlenecks.

## 🐛 Bug Reports & Issues

If you encounter issues:

1. Check [CHANGELOG.md](./CHANGELOG.md) for known issues and recent fixes
2. Review [WIDGET_HOOKS_API.md#troubleshooting](./WIDGET_HOOKS_API.md#troubleshooting)
3. Reproduce with minimal code example
4. Check browser console for errors
5. Open an issue with reproduction steps

## 🤝 Contributing

We welcome contributions! Areas for help:

- **More widgets** – Color, gradient, animation, geometry editors
- **Performance optimizations** – Tokenizer caching, suggestion memoization
- **Documentation** – Tutorials, guides, examples
- **Accessibility** – Screen reader testing, keyboard navigation
- **Localization** – Multi-language UI

## 📜 License

MIT © 2026

---

## 🎓 Next Steps

1. **Start here:** [DOCUMENTATION.md](./DOCUMENTATION.md)
2. **Learn hooks:** [WIDGET_HOOKS_API.md](./WIDGET_HOOKS_API.md)
3. **Build a widget:** [CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md)
4. **Understand internals:** [rce_architecture_summary.md](./rce_architecture_summary.md)

Happy coding! 🚀

---

## 📝 Recent Changes

See [CHANGELOG.md](./CHANGELOG.md) for:

- **New:** Widget hooks API (`useWidgetToken`, `useWidgetDrag`)
- **New:** Typing-triggered suggestions
- **Fixed:** Widget decorator text contamination
- **Fixed:** Color corruption on text insertion
- **Fixed:** Render visual artifacts

Migration guides available for existing code.
