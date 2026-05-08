# Babel Component Extraction (`ComponentExtractor`)

Antes de traduzir o JSX para Liquid ou fazer o bundle do React, o LiquidX precisa compreender a estrutura do arquivo. O `ComponentExtractor` (localizado em `lib/infra/adapters/parsers/babel/component/index.ts`) usa a AST gerada pelo `@babel/parser` para extrair essas informações e organizá-las na entidade `ComponentMetadataType`.

## O Pipeline de Extração

A extração acontece na seguinte ordem:

1. **Leitura de Diretivas**
2. **Resolução de Exports (Nome, Corpo, JSX)**
3. **Coleta de Statements (Scripts e Variáveis)**
4. **Extração de Schemas do Shopify**
5. **Extração de Imports CSS**

---

## 1. Diretivas (`DirectiveParser`)
O compilador lê as strings no topo do arquivo (diretivas) ou no topo do corpo da função principal para definir o modo de execução:

- `/^use dom(:global)?$/`: Define o modo para executar JS no cliente (sem React). Se tiver `:global`, o JS será injetado globalmente na página.
- `/^use script$/`: Alias antigo para `use dom:global`.
- `/^use react(?:\s*\((#?[^)]+)\))?$/`: Define o modo de ilhas React. Pode conter um `rootId` entre parênteses para renderizar em uma div específica ao invés de um Custom Element (ex: `'use react(#app)'`).
- `/^use (blocks|sections|snippets)$/`: Define explicitamente o diretório de destino do componente.

---

## 2. Parsing de Exports (`ExportParser` e sub-parsers)
O Babel percorre a árvore procurando por `ExportNamedDeclaration` e `ExportDefaultDeclaration`.
Dependendo do tipo exportado, um sub-parser específico atua:

- **Se for `FunctionDeclaration` (`export function Comp() {}`)**:
  - `FunctionBodyParser`: Captura o nome da função e passa o conteúdo do bloco de função para o `StatementCollector`.
- **Se for `VariableDeclaration` (`export const Comp = () => {}`)**:
  - `VariableParser`: Captura o nome da variável. Se for uma Arrow Function, passa o conteúdo para o `StatementCollector`.

---

## 3. Coleta de Statements (`StatementCollector`)
Este é o core da extração de código lógico. Ele itera por todas as linhas da função principal do componente e decide o que fazer com elas:

1. **Return do Componente**: Se for um `ReturnStatement` que retorna um JSX, ele o extrai para `metadata.jsxElement`. Esse JSX não fará parte do código JS final, mas será processado pelo `LiquidParser`.
2. **Variáveis e IFs no modo Liquid**: 
   - Se o modo for `liquid` (o padrão), ele delega `VariableDeclaration` e `IfStatement` para o `LiquidVariableParser`.
   - O `LiquidVariableParser` traduz esse código para strings do tipo `{% assign ... %}` e as guarda em `metadata.liquidAssignments`.
3. **Lógica JS (Modo DOM/React)**: Se a linha não for o return JSX nem um assign Liquid traduzível, a linha de código é guardada em `metadata.scriptStatements`. Ela será compilada no arquivo `.js` resultante.

### Verificação de JS "Órfão"
Se o modo for `liquid` e o `StatementCollector` encontrar declarações JS complexas no topo do arquivo que não puderam ser convertidas para Liquid (ex: chamadas de função complexas no escopo global), a flag `metadata.hasUncoveredJs` é ativada. Isso causa um erro de compilação informando ao usuário que ele precisa usar a diretiva `'use dom'`.

---

## 4. Schemas Shopify (`SchemaExtractor`)
Em arquivos Liquid de seções e blocos, o Shopify requer um bloco `{% schema %}`. O LiquidX extrai esse objeto JSON diretamente do código JS/TS.

Ele procura por:
- `export default { name: "...", settings: [...] }`
- `const schema = { ... }`

**Poderes Especiais do SchemaExtractor:**
- **Resolução de Imports:** Se o schema usa `import { colors } from './settings.ts'`, o parser pausa o processo atual, vai até o arquivo importado, faz o parse nele e traz o valor resultante!
- **Resolução Local:** Se o schema usa referências a variáveis criadas acima dele (`const fields = []; const schema = { settings: fields }`), ele resolve a referência.
- **Spread Operator:** Ele suporta expansão via spread operator (`...fields`).

Isso permite compor schemas do Shopify usando toda a robustez e modularização do TypeScript.

---

## 5. Extração de CSS (`CSSImportExtractor`)
Se o componente possui um import de arquivo `.css` (`import './styles.css'` ou `import styles from './module.css'`), o compilador:

1. Remove o import da AST do Babel para que não quebre no navegador.
2. Abre o arquivo CSS no disco e lê seu conteúdo.
3. Se for importado como módulo (`import styles`), ele procura no arquivo por usos como `styles.container` e os substitui por strings estáticas `"container"`. O conteúdo CSS é anexado para ser colocado dentro do `{% stylesheet %}` do arquivo gerado.
4. Se for importado globalmente, o CSS é separado para ser anexado ao arquivo final `global.css`.
