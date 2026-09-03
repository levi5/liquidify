# Camada de Aplicação

A camada `application` coordena o fluxo de dados entre o usuário (CLI) e a lógica interna (Core/Infra).

## Serviços (`lib/application/services`)

### `TranspileFile`
Este é o serviço principal chamado durante o build ou watch.
1.  Recebe um caminho de arquivo.
2.  Lê o conteúdo usando o `FileSystem`.
3.  Chama o `Parser` (`BabelLiquidParser`) para obter o `ParsedComponent`.
4.  Salva os arquivos gerados (.liquid, .json, .js, .css) nas pastas corretas do tema Shopify, respeitando a estrutura do projeto.

### `ValidationService`
Garante a integridade do código Liquid gerado.
- Impede o uso de lógica complexa de React em pastas onde o Shopify exige Liquid puro.
- Alerta sobre o uso de JavaScript sem a diretiva necessária (`'use dom'`).

---

# Camada Principal (Main)

### Fábricas (`lib/main/factories`)

O Liquidify utiliza o padrão Factory para instanciar o sistema. O `makeLiquidifyBuilder` (ou similar) é responsável por:
1.  Instanciar os adaptadores de infraestrutura (Esbuild, Babel, NodeFS).
2.  Injetá-los nos serviços de aplicação.
3.  Retornar uma fachada simples para a CLI utilizar.

Isso permite que, no futuro, possamos trocar o `esbuild` por outro compilador ou o Babel por outro parser sem alterar a lógica de aplicação.
