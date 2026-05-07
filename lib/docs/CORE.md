# Camada Core (Domínio)

A camada `core` define as regras de negócio fundamentais e os contratos (interfaces) que o restante do sistema deve seguir. Ela não possui dependências externas de infraestrutura.

## Entidades (`lib/core/entities`)

### `Config`
Representa a configuração global do LiquidX, carregada a partir do arquivo `.liquidxrc`. Define as pastas de entrada/saída e comportamentos do compilador.

### `ParsedComponent`
O resultado final da transpilação de um arquivo. Contém:
- `html`: O código Liquid gerado.
- `script`: JavaScript compilado (se houver).
- `schema`: O schema JSON do Shopify extraído.
- `mode`: O modo de execução (`liquid`, `react`, `dom`, `dom:global`).
- `type`: Se o componente é um `section`, `snippet` ou `block`.

### `Liquid`
Define tipos e utilitários básicos relacionados à sintaxe do Liquid.

## Protocolos (`lib/core/protocols`)

Os protocolos são interfaces que permitem o desacoplamento. A implementação real reside na camada de `infra`.

### `IParser`
Contrato para análise de arquivos fonte. Recebe uma string e retorna um `ParsedComponent`.
- **Implementação Principal**: `BabelLiquidParser`.

### `Compiler`
Define como o código (TS/JS/CSS) deve ser compilado.
- **Implementações**: `EsbuildCompiler`, `ReactComponentCompiler`.

### `FileSystem`
Interface para abstrair o acesso ao disco, permitindo o uso de sistemas de arquivos virtuais em testes.
- **Implementação**: `NodeFileSystem`.

### `Generator`
Contrato para geração de código final a partir de uma estrutura interna.

### `PathResolver`
Resolve caminhos de arquivos, especialmente útil para imports com aliases do TypeScript.
