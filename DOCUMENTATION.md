# React Code Editor – Widget Development Documentation

Welcome! This directory contains comprehensive documentation for building custom widgets in React Code Editor (RCE).

## 📚 Documentation Index

### For Widget Developers

Start here if you want to build custom interactive widgets:

1. **[WIDGET_HOOKS_API.md](./WIDGET_HOOKS_API.md)** – Complete API reference
   - `useWidgetToken()` – Token state and dispatch helpers
   - `useWidgetDrag()` – Document-level drag interactions
   - `sanitizeWidgetText()` – Text cleaning utility
   - TypeScript types and best practices

2. **[CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md)** – Step-by-step examples
   - Quick start tutorial
   - Anatomy of a widget
   - Complete examples: Color Picker, Number Slider
   - Advanced patterns (multi-part widgets, validation, context-aware)
   - Common pitfalls and how to avoid them
   - Testing strategies

### For Architecture Deep Dive

Understanding how RCE works internally:

3. **[rce_architecture_summary.md](./rce_architecture_summary.md)** – Core architecture
   - Surgical rendering & memoization
   - Token reconciliation for stable IDs
   - Local interaction model for smooth drags
   - Atomic reducer updates
   - **Widget Hooks philosophy**
   - ContentEditable DOM safety patterns
   - Rendering segment strategy

### Tracking Changes

4. **[CHANGELOG.md](./CHANGELOG.md)** – Recent improvements and bug fixes
   - Widget hooks API addition
   - Typing-triggered suggestions
   - Fixed: Decorator contamination bug
   - Fixed: Color corruption on text insertion
   - Fixed: Render visual artifacts
   - Migration guides from old patterns

---

## 🚀 Quick Start

### 1. Install RCE

```bash
npm install react-code-editor
# or
pnpm add react-code-editor
```

### 2. Create a Simple Widget

```typescript
import { WidgetComponent, useWidgetToken } from "react-code-editor"

// 1. Define a tokenizer (finds matches in code)
function numberTokenizer(code: string) {
  const ranges = []
  const regex = /\d+/g
  let match
  while ((match = regex.exec(code)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length })
  }
  return ranges
}

// 2. Create your widget component
const NumberWidget: WidgetComponent = ({ children, token }) => {
  const { text, setText } = useWidgetToken(token)
  
  const handleDoubleClick = () => {
    const newValue = prompt("New number:", text)
    if (newValue) setText(newValue)
  }
  
  return (
    <span onDoubleClick={handleDoubleClick} style={{ cursor: "pointer" }}>
      {children}
    </span>
  )
}

// 3. Attach the tokenizer
NumberWidget.widget = { tokenizer: numberTokenizer }

export default NumberWidget
```

### 3. Use in Your Editor

```typescript
import { Editor, useWidgets } from "react-code-editor"
import NumberWidget from "./NumberWidget"

export function MyEditor() {
  const widgets = useWidgets([NumberWidget])
  
  return (
    <Editor
      initialCode="The answer is 42 and pi is 3.14159"
      widgets={widgets}
    />
  )
}
```

---

## 🎯 Common Tasks

### Build a draggable number widget
See **[CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md#example-number-slider-widget)** – Complete example with `useWidgetDrag()`

### Understand why my decorator text appeared in the code
See **[CHANGELOG.md](./CHANGELOG.md#widget-decorator-contamination-bug)** – Explains the bug and solution

### Debug widget state synchronization issues
See **[WIDGET_HOOKS_API.md](./WIDGET_HOOKS_API.md#troubleshooting)** – Troubleshooting section with solutions

### Migrate from old `useEditor()` pattern
See **[CHANGELOG.md](./CHANGELOG.md#migration-guides)** – Step-by-step migration examples

### Learn about token reconciliation
See **[rce_architecture_summary.md](./rce_architecture_summary.md#2-token-reconciliation)** – How stable token IDs work

---

## 📋 Widget Development Checklist

- [ ] **Tokenizer works correctly**
  - [ ] Regex matches all intended patterns
  - [ ] No unintended matches in comments/strings
  - [ ] Performance is acceptable on large files

- [ ] **Component uses widget hooks**
  - [ ] `useWidgetToken(token)` for state/dispatch
  - [ ] `useWidgetDrag()` for drag interactions
  - [ ] `tokenRef` in event handlers to avoid stale closures

- [ ] **Text handling is safe**
  - [ ] Call `sanitizeWidgetText()` or rely on hook's auto-sanitization
  - [ ] No newlines in output text
  - [ ] Unit strings (like "px") are preserved

- [ ] **Interaction is smooth**
  - [ ] Local state updates immediately (`setLocalValue`)
  - [ ] Global state updates simultaneously (`setText`)
  - [ ] Drag cursor changes appropriately

- [ ] **Testing covers edge cases**
  - [ ] Empty token text
  - [ ] Very large numbers
  - [ ] Rapid consecutive edits
  - [ ] Widgets at start/end of document

---

## 🔗 Related Resources

- **[Monorepo structure](./rce/)** – RCE package and example app
  - `rce/src/` – Main editor library
  - `rce/src/widgets/` – Built-in widgets (NumberWidget, ColorWidget, etc.)
  - `rce/src/hooks/widgetHooks.ts` – The new widget hooks implementation
  - `example/` – Demo application

- **[Package exports](./rce/src/index.ts)** – What's available for import
  - `Editor` – Main component
  - `useEditor()` – Global editor state hook
  - `useWidgets()` – Widget provider hook
  - `useWidgetToken()`, `useWidgetDrag()`, `sanitizeWidgetText()` – Widget hooks
  - Type definitions for `WidgetComponent`, `Token`, etc.

---

## ❓ FAQ

**Q: Do I have to use the widget hooks?**  
A: No, they're optional. Widgets can still use `useEditor()` directly. But hooks provide a cleaner API and prevent common mistakes.

**Q: Can widgets span multiple lines?**  
A: No, widget text is automatically sanitized to remove newlines. They must be single-line inline decorators.

**Q: How do I handle complex value parsing (e.g., CSS shorthand)?**  
A: Tokenize the entire shorthand as one token, then parse its parts in the widget component. See [Advanced Patterns](./CUSTOM_WIDGETS_GUIDE.md#advanced-patterns).

**Q: What happens if two widgets match the same range?**  
A: Only the first registered widget appears. Design tokenizers to be specific to their content.

**Q: Can widgets read other parts of the code?**  
A: Yes, via `useEditor().state.code`. But be careful with tokenizers that depend on context – they'll re-run on every change.

**Q: Is there a performance limit?**  
A: Editors with 10,000+ tokens may experience slowdown. Profile with React DevTools if performance is a concern.

---

## 🐛 Reporting Issues

If you find a bug or have a feature request:

1. Check [CHANGELOG.md](./CHANGELOG.md) to see if it's a known issue
2. Reproduce with a minimal example
3. Include browser DevTools console output
4. Open an issue with the reproduction steps

---

## 📖 Documentation Structure

```
react-code-editor/
├── WIDGET_HOOKS_API.md           ← API Reference (start here)
├── CUSTOM_WIDGETS_GUIDE.md       ← Examples & patterns
├── CHANGELOG.md                  ← What changed & why
├── rce_architecture_summary.md   ← How it works inside
├── rce/                          ← Source code
│   ├── src/hooks/widgetHooks.ts  ← Implementation
│   ├── src/widgets/              ← Example widgets
│   └── src/index.ts              ← Public exports
└── example/                      ← Demo app
```

---

## 🎓 Learning Path

**Beginner:**
1. Read [CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md#quick-start) Quick Start
2. Follow the Color Picker example
3. Test with the example app

**Intermediate:**
1. Read [WIDGET_HOOKS_API.md](./WIDGET_HOOKS_API.md) complete reference
2. Study the Number Slider example with `useWidgetDrag()`
3. Experiment with advanced patterns (multi-part widgets, validation)

**Advanced:**
1. Read [rce_architecture_summary.md](./rce_architecture_summary.md) sections 2-7
2. Explore `rce/src/hooks/widgetHooks.ts` implementation
3. Review `rce/src/cores/Canvas.tsx` rendering pipeline
4. Study token reconciliation in `rce/src/utils/tokenizer.ts`

---

## 💡 Tips

- **Use TypeScript:** Type safety catches widget bugs early
- **Test edge cases:** Empty values, special characters, rapid edits
- **Profile rendering:** React DevTools Profiler shows widget re-renders
- **Keep tokenizers fast:** Avoid expensive operations in tokenizer functions
- **Preserve units:** Remember to include units (px, %, em) when updating numeric widgets

---

## 📝 License

React Code Editor is [MIT licensed](./LICENSE).

---

**Last Updated:** May 2026  
**Widget Hooks Version:** 1.0 (Stable)  
**Documentation Version:** 1.0
