# Algoritmos Complexos e Manipulação de AST

Este documento detalha os algoritmos mais sofisticados do LiquidX.

---

## 1. Resolução Recursiva de Schemas (`SchemaExtractor`)

O `SchemaExtractor` é capaz de resolver definições de objetos através de múltiplos arquivos:
- **Fluxo**: Ele identifica um identificador, verifica se ele foi importado, localiza o arquivo fonte, analisa a exportação naquele arquivo e extrai o valor literal.
- **Detecção de Ciclos**: Mantém um histórico de identificadores visitados para evitar loops infinitos em referências circulares.

---

## 2. Transformação AST Dinâmica (`ExpressionParser`)

Durante a geração de código Liquid, o `ExpressionParser` realiza mutações em tempo real na árvore AST:
- **Filtros Liquid**: Métodos nativos de JS (`toLowerCase`, `trim`) são identificados e o nó da AST é substituído por uma representação que o gerador de código entende como um filtro Liquid (`| downcase`, `| strip`).
- **Lógica de Curto-Circuito**: Expressões como `isVisible && <Element />` são decompostas para gerar blocos `{% if %}` equivalentes, mantendo a semântica do JSX.

---

## 3. Isolamento de Escopo e Hidratação (`ScriptGenerator`)

Para permitir que o JavaScript do cliente funcione sem conflitos:
- **Mapeamento de Escopo**: O gerador identifica todas as variáveis e funções de nível superior e as anexa a um objeto de escopo global (`window.liquidx['component-name']`).
- **Encapsulamento**: Todo o código é envolvido em uma IIFE, garantindo isolamento total e impedindo que variáveis locais vazem para o escopo global do tema Shopify.

---

## 4. Normalização de Eventos (`LiquidAttributeConverter`)

Ao converter eventos como `onClick`, o parser analisa a função de callback:
- Ele detecta o nome dado ao argumento de evento (ex: `e`, `evt`, `event`).
- Normaliza todas as referências internas para usar o objeto `event` padrão do navegador no atributo HTML final.
