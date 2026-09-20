# Adaptadores de Infraestrutura

Esta camada contém as implementações que dependem de ferramentas externas.

## Compiladores (`lib/infra/adapters/compilers`)

### `EsbuildCompiler`
Utiliza o **Esbuild** para transpilar TypeScript e minificar JavaScript/CSS. É escolhido pela sua performance extrema, permitindo que o `watch` do Liquidify seja quase instantâneo.

### `ReactComponentCompiler`
Usado quando o modo é `'use react'`.
- Gera um bundle independente para o componente.
- Utiliza o `runtime-builder.ts` para injetar as bibliotecas necessárias (React, ReactDOM) de forma otimizada.
- Garante que estilos CSS associados ao componente React sejam injetados via `CssInjector`.

## Sistema de Arquivos (`lib/infra/adapters/fs`)

### `NodeFileSystem`
Implementação baseada no módulo `fs` do Node.js. Inclui lógica para criar pastas recursivamente, garantindo que a estrutura do tema Shopify seja mantida ao salvar os arquivos gerados.
