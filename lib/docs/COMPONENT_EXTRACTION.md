# Component Extraction and Hydration

This document details how Liquidify analyzes a `.tsx` file to separate what should be processed on the server (Shopify/Liquid) and what should be sent to the browser (Client-side JS).

## The Main Extractor (`ComponentExtractor`)

`ComponentExtractor` scans the file and populates the metadata object using key sub-parsers:

1. **`DirectiveParser`**: Looks for directives at the top of the file or functions, such as `'use dom'`, `'use script'`, or `'use react'`.
2. **`ExportParser`**: Identifies `export default` to determine the component name and render entry point.
3. **`StatementCollector`**: The core classifier that categorizes each line of code.

---

## Code Classification (`StatementCollector`)

`StatementCollector` walks through statements and categorizes them:

### 1. Main JSX Element

Identifies the `return` of the main function. This element is forwarded to `LiquidParser` to be transformed into HTML/Liquid.

### 2. Liquid Assignments (`liquidAssignments`)

In pure `liquid` mode, variables declared at the top-level scope (e.g., `const title = 'Hello'`) are converted into `{% assign title = 'Hello' %}` tags.

### 3. Script Statements (`scriptStatements`)

In `dom` or `dom:global` mode, functions and variables are collected to be bundled and served to the browser.

---

## Script Generation and Scoping (`ScriptGenerator`)

To prevent collisions between multiple components on the same page, `ScriptGenerator` wraps code in an **IIFE (Immediately Invoked Function Expression)** and creates a global scope:

### The `window.liquidify` Object

The generated code follows this pattern:
```javascript
(function() {
  window.liquidify = window.liquidify || {};
  window.liquidify['component-name'] = {};
  const scope = window.liquidify['component-name'];
  
  // User code goes here
  function handleClick() { ... }
  
  // Automatic export to the scope
  scope.handleClick = handleClick;
})();
```

This allows Liquid Event Handlers (such as `onclick`) to invoke the correct functions without polluting the global `window` scope.
