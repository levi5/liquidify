# Eventos React, Liquid e editor Shopify

## Configuração

Em `liquidify.config.json`:

```json
{
  "componentsDir": "src/components",
  "output": ".",
  "react": { "strictCsp": true }
}
```

`strictCsp` já é `true` por padrão. O runtime não transforma código escrito em atributos HTML em funções com `new Function`. Funções JSX, `addEventListener` e ações registradas continuam funcionando. Essa opção não instala a política CSP da loja: os arquivos JS ainda precisam ser permitidos por origem ou nonce.

## 1. Eventos no componente React

```tsx
'use react'

import { useState } from 'preact/hooks'

export function Counter() {
  const [quantity, setQuantity] = useState(1)

  return (
    <button type="button" onClick={() => setQuantity(quantity + 1)}>
      Quantidade: {quantity}
    </button>
  )
}
```

O clique recebe uma função compilada no bundle. Nenhum código é interpretado a partir de texto. `onInput`, `onChange` e `onSubmit` seguem o mesmo padrão.

## 2. Ações em HTML Liquid convertido para React

Registre a ação no componente que recebe o conteúdo Liquid. Use um nome diferente por instância para evitar que seções sobrescrevam os registros umas das outras.

Arquivo `src/components/ActionBox.tsx`:

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
      console.log('Produto selecionado:', button.dataset.productId)
    })
  }, [actionName])

  return <div>{children}</div>
}
```

No HTML Liquid da seção:

```liquid
{% assign buy_action = 'comprar-' | append: section.id %}
<react-island component="ActionBox" data-hydrate="eager">
  <script type="application/json" data-react-props>
    {"actionName": {{ buy_action | json }}}
  </script>
  <button
    type="button"
    data-liquidify-on-click="{{ buy_action | escape }}"
    data-product-id="{{ product.id }}"
  >
    Comprar
  </button>
</react-island>
```

Carregue os assets uma vez no layout, na ordem abaixo, caso o tema ainda não os inclua:

```liquid
<script src="{{ 'react-runtime.js' | asset_url }}" defer></script>
<script src="{{ 'action-box.js' | asset_url }}" defer></script>
```

O atributo contém o nome da ação, não código JavaScript. A função retornada por `registerLiquidifyAction` remove o registro; o retorno de `useLayoutEffect` executa essa limpeza ao desmontar a seção. Se você usar o mesmo componente mais de uma vez na seção, acrescente um identificador de instância ao nome da ação.

Eventos suportados na ponte: `click`, `change`, `input`, `submit`, `keydown`, `keyup`, `focus`, `blur`, `dblclick`, `pointerdown` e `pointerup`.

Essa ponte atua nos nós convertidos pelo runtime para React. Não instala listeners em todo o HTML da página.

## 3. Eventos em HTML Liquid fora das ilhas

No Liquid:

```liquid
<button type="button" data-product-buy="{{ product.id }}">Comprar</button>
```

No JS global do tema, carregado uma vez:

```js
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest('button[data-product-buy]')
  if (!(button instanceof HTMLButtonElement) || button.disabled) return
  console.log('Produto selecionado:', button.dataset.productBuy)
})
```

O listener no documento também recebe cliques dos botões inseridos pelo editor depois da carga inicial. Não é necessário reinstalá-lo a cada troca de seção.

## 4. Comunicação entre componentes

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
      onClick={() => emitLiquidifyEvent('cart:notice', { message: 'Carrinho atualizado' })}
    >
      {message || 'Notificar'}
    </button>
  )
}
```

O hook cancela sua inscrição quando o componente desmonta. Para inscrições manuais com `LiquidifyEvents.on`, guarde e chame a função de cancelamento. Eventos do barramento são globais; inclua o identificador da seção no nome ou nos dados quando precisar restringir os destinatários.

## Ciclo de vida no editor Shopify

O runtime escuta os eventos no documento e usa a seção indicada por `event.target`, conforme o [contrato de eventos da Shopify](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks).

- `shopify:section:unload`: desmonta imediatamente as raízes da seção, cancela observadores, timers internos de desmontagem e listeners de prontidão. As funções de cleanup dos efeitos React são executadas. O runtime descarta os dados antigos e impede remontagens automáticas dessa seção até receber `load`.
- `shopify:section:load`: monta as ilhas e raízes por ID presentes na seção, respeitando a estratégia de hidratação. Se o bundle do componente ainda não chegou, aguarda seu evento de prontidão. Eventos repetidos não duplicam as raízes.

As outras seções permanecem montadas. Movimentos comuns no DOM, fora desse ciclo explícito, continuam usando a tolerância de 100 ms antes da desmontagem.

Listeners, timers e ações criados pelos seus componentes precisam retornar cleanup em `useEffect` ou `useLayoutEffect`. O runtime executa esses cleanups, mas não consegue remover recursos globais que não foram associados a eles. A integração não baixa bundles ausentes nem trata seleção de blocos como carga de seção.

## Validação

```sh
npm test
npm run test:example:browser
npm run build:example
npm run typecheck:example
```

A suíte de navegador usa os componentes de `example` e simula eventos Shopify em Chrome com CSP estrita e modo legado. Cobre troca dos dados da seção, montagem por ID, eventos JSX após remontagem, limpeza de efeitos e inscrições, cancelamento de hidratação pendente, componentes atrasados e isolamento entre seções. As respostas do carrinho são simuladas; não é uma execução dentro de uma loja Shopify real.

## Tipos em `data-liquid-*`

Os valores JSON mantêm seu tipo nos props, incluindo valores vazios e `false`:

```html
<react-island
  component="ProductDetails"
  data-liquid-title='"Camiseta"'
  data-liquid-available="false"
  data-liquid-count="0"
  data-liquid-tags='["novo", "algodão"]'
  data-liquid-discount="null"
></react-island>
```

O componente recebe `title` como string, `available` como booleano, `count` como número, `tags` como array e `discount` como `null`. `ProductDetails` representa um componente do seu tema. No Liquid, serialize dados dinâmicos com `{{ valor | json | escape }}` dentro de atributos entre aspas.

Valores locais substituem valores herdados quando são primitivos, arrays ou `null`. Objetos são mesclados superficialmente apenas com outros objetos; arrays não são concatenados nem convertidos em objetos. Texto simples sem aspas JSON continua sendo aceito como string; um atributo vazio preserva a string vazia. `data-liquid` e `data-liquid-store` seguem as mesmas regras e alimentam a prop `store`.
