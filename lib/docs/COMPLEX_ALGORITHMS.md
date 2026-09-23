# Complex Algorithms and AST Manipulation

This document details the most sophisticated algorithms implemented in Liquidify.

---

## 1. Recursive Schema Resolution (`SchemaExtractor`)

`SchemaExtractor` can resolve object definitions across multiple files:
- **Flow**: It identifies an identifier, checks if it was imported, locates the source file, analyzes the export in that file, and extracts the literal value.
- **Cycle Detection**: Maintains a visited identifier history to prevent infinite loops in circular references.

---

## 2. Dynamic AST Transformation (`ExpressionParser`)

During Liquid code generation, `ExpressionParser` performs real-time mutations on the AST:
- **Liquid Filters**: Native JS methods (`toLowerCase`, `trim`) are identified and replaced with AST nodes that the code generator interprets as Liquid filters (`| downcase`, `| strip`).
- **Short-Circuit Logic**: Expressions like `isVisible && <Element />` are decomposed into equivalent `{% if %}` blocks while preserving JSX semantics.

---

## 3. Scope Isolation and Hydration (`ScriptGenerator`)

To allow client-side JavaScript to execute without conflicts:
- **Scope Mapping**: The generator identifies all top-level variables and functions and attaches them to a global scope object (`window.liquidify['component-name']`).
- **Encapsulation**: All code is wrapped in an IIFE, guaranteeing full isolation and preventing local variables from leaking into the Shopify theme's global scope.

---

## 4. Event Normalization (`LiquidAttributeConverter`)

When converting events such as `onClick`, the parser analyzes the callback function:
- It detects the argument name given to the event (e.g., `e`, `evt`, `event`).
- Normalizes all internal references to use the browser standard `event` object in the final HTML attribute.

