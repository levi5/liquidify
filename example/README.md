# Liquidify — loja de moda Shopify

Tema de e-commerce em português, desenvolvido em **TSX dentro de `src`**, usando o **Liquidify deste repositório** e Preact. O catálogo vem da loja Shopify; as fotos dos banners são cópias de imagens do próprio catálogo de desenvolvimento.

## Desenvolvimento

Instale as dependências na **raiz do repositório** e execute:

```bash
pnpm install
npm run build:example
npm run dev:example
```

O exemplo reutiliza as dependências da raiz; não é necessário instalar pacotes dentro de `example`. Os comandos compilam a biblioteca em `dist` antes de gerar o tema. O TypeScript resolve os imports de `liquidify` para os tipos desse build local.

Se já estiver dentro de `example`, use `npm run build`, `npm run dev` e `npm run typecheck`. O modo de desenvolvimento acompanha componentes, arquivos compartilhados de `src`, CSS, JavaScript, templates, configuração e layout. Alterações em `dist` também recompilam o tema; ao editar a biblioteca em `lib`, rode `npm run build` na raiz.

Em outro terminal, inicie a prévia na loja configurada:

```bash
npm --prefix example run preview
```

A CLI mostra a porta disponível. Para escolher uma porta:

```bash
npm --prefix example run preview -- --port 9393
```

Loja configurada: `mm-solution-2141.myshopify.com`. A prévia requer a CLI da Shopify instalada e acesso à loja. Para usar outra loja, execute `npm --prefix example run preview -- --store sua-loja.myshopify.com`. A prévia usa um tema de desenvolvimento; o checkout, os pagamentos e as contas de clientes são fornecidos pela Shopify.

## O que está incluído

- Página inicial de moda, marca Liquidify e paleta preto, branco e cinza.
- Avisos rotativos com três mensagens editáveis, setas, pausa e respeito à preferência por movimento reduzido.
- Menus Novidades, Feminino, Masculino e Acessórios, com submenus no desktop e no celular; menu personalizado aceita até três níveis configurados na Shopify.
- Cabeçalho com ícones de busca, login e sacola, sem rótulos visuais; contador sobre a sacola atualizado após cada alteração.
- Cards com segunda imagem no hover, preço, disponibilidade e compra rápida para produtos com uma variante; produtos com opções levam à seleção na página de produto.
- Catálogo com filtros em uma lateral de 280px no desktop e em um drawer até 680px. Filtros ativos com remoção individual, limpeza que mantém a ordenação e ordenação automática.
- Paginação numerada no catálogo e na busca, com 12 resultados por página. A quantidade pode ser ajustada de 6 a 36 no editor. Links preservam os filtros, a ordenação e o termo buscado.
- Produto com galeria, mídias Shopify, variantes, quantidade, botão de adicionar limitado a 320px, indicação de combinações indisponíveis e formulário que preserva a variante da URL mesmo sem JavaScript.
- Produtos relacionados pela API de recomendações da Shopify, com alternativas da coleção enquanto a resposta não chega ou se o serviço falha. O produto aberto não é repetido.
- Minicarrinho e página de sacola com atualização pela Ajax API, erros de estoque, remoção e encaminhamento ao checkout.
- Busca, páginas institucionais, formulário de contato, lista de coleções, blog, artigo e página 404.
- Newsletter nativa Shopify, políticas da loja, metadados sociais e dados estruturados de produto.

## Onde editar

| Local | Conteúdo |
| --- | --- |
| `src/components/sections/` | Seções TSX e schemas do editor Shopify |
| `src/components/snippets/` | Cards, filtros, ícones SVG e paginação reutilizáveis |
| `src/components/islands/` | Minicarrinho, busca, submenus mobile, drawer de filtros e compra em Preact |
| `src/ui/` | Componentes compartilhados pelas ilhas |
| `src/lib/shopify.ts` | Integração da sacola e formatação monetária |
| `src/scripts/theme.ts` | Avisos rotativos, compra rápida e galeria |
| `src/styles/theme.css` | Estilos e responsividade |
| `templates/` | Composição das páginas Shopify |
| `config/` | Nome e cores da marca |
| `scripts/` | Só para o monorepo: compilação com a biblioteca local, assets, watch e verificação (fora daqui use `npx liquidify`) |

`sections/*.liquid`, os snippets correspondentes aos componentes TSX e os bundles JavaScript são resultados do build. Edite o TSX de origem para preservar as alterações nas próximas compilações. O layout, os templates JSON e `snippets/css-variables.liquid` são arquivos nativos do tema.

Os estilos dos submenus e filtros estão nos próprios arquivos TSX. `MainCollection.tsx` inclui `CollectionFilters.tsx`, com a ilha `FilterDrawer.tsx`, e é referenciado por `templates/collection.json`. A ilha reutiliza o mesmo formulário Liquid na lateral e no drawer, mantendo as seleções ao redimensionar. Sem JavaScript, os filtros continuam acessíveis na página e o botão “Aplicar filtros” também envia a ordenação escolhida.

`ProductRecommendations.tsx` está ligado ao template de produto. A paginação usa o snippet `Pagination.tsx` e o componente `PaginateByLiquid` exportado pela biblioteca local, que já aceita o nome Liquid da configuração de tamanho de página.

> **Nota de monorepo:** a pasta `scripts/` só existe por causa deste monorepo. `build.mjs` usa a API do compilador local (`../../dist`), `build-assets.mjs` compila o CSS e o JavaScript compartilhado, `dev.mjs` recompila o tema quando os arquivos mudam e `verify-build.mjs` valida os arquivos gerados. Em um projeto normal instalado via npm você não precisa dela — basta `npx liquidify` / `npx liquidify --watch`. Erros emitidos pelo compilador fazem o build terminar com falha, mesmo quando a versão alpha consegue continuar compilando outros componentes.

A página `page.contact.json` deve ser atribuída à página de contato no administrador. Os filtros disponíveis dependem da configuração do Shopify Search & Discovery. Os links Feminino e Masculino usam as tags existentes no catálogo; os destinos podem ser substituídos por coleções no editor. Produtos que exigem assinatura precisam de um seletor de plano adicional; o tema bloqueia a compra sem o plano obrigatório.

## Verificações

Na raiz do repositório:

```bash
npm run build:example
npm run typecheck:example
npm --prefix example run verify
npm --prefix example run check
```

`check` usa o Theme Check da CLI da Shopify. Esta cópia não inclui o teste de navegador do projeto original. Os fluxos com catálogo, variantes, filtros e sacola devem ser conferidos na prévia da sua loja, inclusive com JavaScript desabilitado.

O build também verifica saídas vazias, referências a seções inexistentes e problemas conhecidos de serialização. Veja [as observações sobre a biblioteca](docs/LIQUIDIFY-NOTES.md).
