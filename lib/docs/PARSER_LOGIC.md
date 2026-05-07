# Lógica de Parser e Transformação (Babel)

Esta seção detalha como o LiquidX utiliza o Babel para transformar JSX/TypeScript em Liquid e JavaScript.

## Fluxo de Análise (`BabelLiquidParser`)

O processo de `parse` segue esta sequência:
1.  **Geração da AST**: O código fonte é transformado em uma Árvore de Sintaxe Abstrata (AST).
2.  **Extração de Metadados (`ComponentExtractor`)**: Analisa imports, export default, diretivas e identifica se há um elemento JSX principal.
3.  **Validação**: O `ValidationService` verifica se o código é permitido na pasta alvo.
4.  **Processamento de CSS**: Extrai estilos e imports de CSS Modules.
5.  **Conversão JSX -> Liquid (`LiquidParser`)**: Onde a mágica acontece.

---

## Componentes do `LiquidParser`

O `LiquidParser` orquestra vários sub-parsers especializados:

### `LiquidAttributeConverter`
Transforma atributos JSX em atributos HTML/Liquid.
- **Event Handlers**: Converte `onClick={handler}` em chamadas globais do LiquidX (ex: `onclick="liquidx['comp'].handler(event)"`) se estiver no modo DOM.
- **Classes Dinâmicas**: Trata `className` e literais de template.
- **Booleanos**: Converte condicionais simples em tags `{% if %}` inline.

### `LiquidExpressionParser`
Analisa expressões dentro de `{ }`.
- Suporta mapeamento de métodos JS para filtros Liquid (ex: `.toLowerCase()` -> `| downcase`).
- Resolve variáveis importadas de outros arquivos.

### `LiquidLoopParser`
Identifica padrões de `.map()` no JSX e os transforma em blocos `{% for item in collection %}`.

### `LiquidBlockParser`
Trata a tag especial `<DynamicBlock />`, que o Shopify usa para permitir que usuários arrastem e soltem blocos dentro de uma seção. Ele gera o código `{% content_for 'blocks' %}` e extrai o schema correspondente.

### `LiquidConditionalParser`
Transforma Operadores Ternários (`a ? b : c`) e Curto-circuitos (`a && b`) em blocos `{% if %}` e `{% unless %}`. Ele gerencia a geração de código recursiva para garantir que condicionais aninhadas funcionem corretamente no Liquid.

### `LiquidPaginateParser`
Transforma o componente `<PaginateByLiquid />` na tag `{% paginate %}` do Shopify, permitindo paginação nativa controlada via JSX.

### `LiquidSvgParser`
Trata a renderização de SVGs através de tags personalizadas, facilitando o reuso de ícones no tema.

### `LiquidVariableParser`
Gerencia a conversão de identificadores e variáveis, garantindo que nomes renomeados (como em loops) sejam propagados corretamente para o código Liquid final.

### `LiquidSnippetParser`
Detecta o uso de componentes que devem ser renderizados como snippets do Shopify (`{% render 'snippet' %}`).

### `LiquidHtmlParser`
Responsável pela renderização final de tags HTML padrão.
- Trata o atributo `dangerouslySetInnerHTML`.
- Garante a abertura e fechamento correto de tags.

---

## Extração de Schema (`SchemaExtractor`)

O LiquidX procura por uma variável chamada `schema` ou um comentário específico para gerar o arquivo `.json` que o Shopify usa para configurar seções e blocos. Ele analisa o objeto JavaScript e o converte fielmente para o formato JSON exigido pelo Shopify.

## Geração de Scripts (`ScriptGenerator`)

Quando a diretiva `'use dom'` ou `'use script'` é encontrada:
1.  O compilador coleta todas as declarações de funções e variáveis no escopo superior.
2.  Elas são "embrulhadas" em uma estrutura que permite a hidratação e execução segura no cliente, mantendo o contexto do componente.
