# Extração de Componentes e Hidratação

Este documento detalha como o Liquidify analisa um arquivo `.tsx` para separar o que deve ser processado no servidor (Shopify/Liquid) e o que deve ser enviado para o navegador (Client-side JS).

## O extrator principal (`ComponentExtractor`)

O `ComponentExtractor` é responsável por varrer o arquivo e preencher o objeto de metadados. Ele utiliza sub-parsers fundamentais:

1.  **`DirectiveParser`**: Procura por diretivas no topo do arquivo ou funções, como `'use dom'`, `'use script'` ou `'use react'`.
2.  **`ExportParser`**: Identifica o `export default` para determinar o nome do componente e o ponto de entrada da renderização.
3.  **`StatementCollector`**: O "cérebro" que classifica cada linha de código.

---

## Classificação de Código (`StatementCollector`)

O `StatementCollector` percorre as declarações do arquivo e as divide em categorias:

### 1. Elemento JSX Principal
Identifica o `return` da função principal. Este elemento é enviado para o `LiquidParser` para ser transformado em HTML/Liquid.

### 2. Atribuições Liquid (`liquidAssignments`)
Se o componente estiver no modo `liquid` puro, variáveis declaradas no escopo superior (ex: `const title = 'Hello'`) são convertidas em tags `{% assign title = 'Hello' %}`.

### 3. Declarações de Script (`scriptStatements`)
Se o modo for `dom` ou `dom:global`, as funções e variáveis são coletadas para serem enviadas ao navegador.

---

## Geração de Scripts e Escopo (`ScriptGenerator`)

Para evitar conflitos entre múltiplos componentes na mesma página, o `ScriptGenerator` encapsula o código em um **IIFE (Immediately Invoked Function Expression)** e cria um escopo global:

### O Objeto `window.liquidify`
O código gerado segue este padrão:
```javascript
(function() {
  window.liquidify = window.liquidify || {};
  window.liquidify['nome-do-componente'] = {};
  const scope = window.liquidify['nome-do-componente'];
  
  // O código do usuário entra aqui
  function handleClick() { ... }
  
  // Exportação automática para o escopo
  scope.handleClick = handleClick;
})();
```

Isso permite que os Event Handlers no Liquid (como `onclick`) chamem as funções corretas sem poluir o escopo global do window.
