# React events, Liquid and the Shopify editor

## Configuration

In `liquidify.config.json`:

```json
{
  "componentsDir": "src/components",
  "output": ".",
  "react": { "strictCsp": true }
}
```

`strictCsp` is already `true` by default. The runtime does not turn code written in HTML attributes into functions with `new Function`. JSX functions, `addEventListener` and registered actions keep working. This option does not install the store's CSP policy: JS files still need to be allowed by origin or nonce.

## 1. Events in the React component

```tsx
'use react'

import { useState } from 'preact/hooks'

export function Counter() {
  const [quantity, setQuantity] = useState(1)

  return (
    <button type="button" onClick={() => setQuantity(quantity + 1)}>
      Quantity: {quantity}
    </button>
  )
}
```

The click receives a function compiled into the bundle. No code is interpreted from text. `onInput`, `onChange` and `onSubmit` follow the same pattern.

## 2. Actions in HTML Liquid converted to React

Register the action in the component receiving the Liquid content. Use a distinct name per instance so sections don't overwrite each other's registrations.

File `src/components/ActionBox.tsx`:

```tsx
'use react'

import { useLayoutEffect } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { registerLiquidifyAction } from 'liquidify/runtime'

export function ActionBox({ actionName, children }: {
  actionName: string
  children?: ComponentChildren
}) {
  useLayoutEffect(() => {
    return registerLiquidifyAction(actionName, function (event) {
      event.preventDefault()
      const button = this as HTMLButtonElement
      console.log('Selected product:', button.dataset.productId)
    })
  }, [actionName])

  return <div>{children}</div>
}
```

In the section's Liquid HTML:

```liquid
{% assign buy_action = 'buy-' | append: section.id %}
<react-island component="ActionBox" data-hydrate="eager">
  <script type="application/json" data-react-props>
    {"actionName": {{ buy_action | json }}}
  </script>
  <button
    type="button"
    data-liquidify-on-click="{{ buy_action | escape }}"
    data-product-id="{{ product.id }}"
  >
    Buy
  </button>
</react-island>
```

Load the assets once in the layout, in the order below, if the theme doesn't include them yet:

```liquid
<script src="{{ 'react-runtime.js' | asset_url }}" defer></script>
<script src="{{ 'action-box.js' | asset_url }}" defer></script>
```

The attribute holds the action name, not JavaScript code. The function returned by `registerLiquidifyAction` removes the registration; the `useLayoutEffect` return runs that cleanup when the section unmounts. If you use the same component more than once in the section, append an instance identifier to the action name.

Supported bridge events: `click`, `change`, `input`, `submit`, `keydown`, `keyup`, `focus`, `blur`, `dblclick`, `pointerdown` and `pointerup`.

This bridge acts on nodes converted by the runtime to React. It does not install listeners across the whole page HTML.

## 3. Events in Liquid HTML outside islands

In Liquid:

```liquid
<button type="button" data-product-buy="{{ product.id }}">Buy</button>
```

In the theme's global JS, loaded once:

```js
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest('button[data-product-buy]')
  if (!(button instanceof HTMLButtonElement) || button.disabled) return
  console.log('Selected product:', button.dataset.productBuy)
})
```

The document listener also receives clicks from buttons inserted by the editor after the initial load. No need to reinstall it on every section change.

## 4. Communication between components

```tsx
'use react'

import { useState } from 'preact/hooks'
import { emitLiquidifyEvent, useLiquidifyEvent } from 'liquidify/runtime'

export function CartNotice() {
  const [message, setMessage] = useState('')
  useLiquidifyEvent<{ message: string }>('cart:notice', (data) => {
    setMessage(data.message)
  })

  return (
    <button
      type="button"
      onClick={() => emitLiquidifyEvent('cart:notice', { message: 'Cart updated' })}
    >
      {message || 'Notify'}
    </button>
  )
}
```

The hook cancels its subscription when the component unmounts. For manual subscriptions with `LiquidifyEvents.on`, keep and call the cancel function. Bus events are global; include the section identifier in the name or payload when you need to restrict recipients.

## Lifecycle in the Shopify editor

The runtime listens to document events and uses the section indicated by `event.target`, following the [Shopify event contract](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks).

- `shopify:section:unload`: immediately unmounts the section's roots, cancels observers, internal unmount timers and readiness listeners. React effect cleanup functions run. The runtime discards old data and blocks automatic remounts of that section until it receives `load`.
- `shopify:section:load`: mounts islands and roots by ID present in the section, honoring the hydration strategy. If the component bundle hasn't arrived yet, it waits for its readiness event. Repeated events don't duplicate roots.

Other sections stay mounted. Common DOM moves outside this explicit cycle keep using the 100 ms tolerance before unmounting.

Listeners, timers and actions created by your components must return cleanup in `useEffect` or `useLayoutEffect`. The runtime runs those cleanups but cannot remove global resources not tied to them. The integration doesn't download missing bundles nor treat block selection as section load.

## Validation

```sh
npm test
npm run test:example:browser
npm run typecheck:example
```

The browser suite uses the `example` components and simulates Shopify events in Chrome with strict CSP and legacy mode. It covers section data swaps, mounting by ID, JSX events after remount, effect and subscription cleanup, pending hydration cancellation, late components and isolation between sections. Cart responses are mocked; it doesn't run inside a real Shopify store.

## Types in `data-liquid-*`

JSON values keep their type in props, including empty values and `false`:

```html
<react-island
  component="ProductDetails"
  data-liquid-title='"T-shirt"'
  data-liquid-available="false"
  data-liquid-count="0"
  data-liquid-tags='["new", "cotton"]'
  data-liquid-discount="null"
></react-island>
```

The component receives `title` as a string, `available` as a boolean, `count` as a number, `tags` as an array and `discount` as `null`. `ProductDetails` stands for a component from your theme. In Liquid, serialize dynamic data with `{{ value | json | escape }}` inside quoted attributes.

Local values replace inherited values when they are primitives, arrays or `null`. Objects merge shallowly only with other objects; arrays are neither concatenated nor converted to objects. Plain text without JSON quotes is still accepted as a string; an empty attribute preserves the empty string. `data-liquid` and `data-liquid-store` follow the same rules and feed the `store` prop.
