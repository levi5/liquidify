# Observações sobre a integração com Liquidify

Este tema exercita `use sections`, `use snippets`, `use react`, `RenderSnippet`, `FormBlock`, `PaginateByLiquid`, schemas, loops com `.map()`/`.slice()`, filtros monetários e a ponte de dados Liquid → Preact. A cópia original usava o pacote publicado `1.0.0-alpha.5`; este exemplo usa o build local em `../dist`. Os casos abaixo registram limitações encontradas na integração original e as adaptações mantidas no tema.

## Casos encontrados durante a integração

1. **Retorno implícito em componentes Liquid.** `export const Header = () => <header>...</header>` concluiu o build, mas produziu somente o schema. As seções e snippets usam corpo com `return` explícito. `scripts/verify-build.mjs` detecta seções vazias.
2. **JSX automático e runtime Preact.** O `preact/jsx-runtime` dos módulos importados tentou acessar `options.vnode` no objeto `window.React`, que é `preact/compat` no runtime da biblioteca. O tema usa o transform clássico, `React.createElement` e `React.Fragment`, no `tsconfig.json`. Componentes compartilhados importam `preact/compat`; as ilhas recebem o objeto React do runtime gerado.
3. **Ponte `liquid-data` e JSON escapado.** A biblioteca transforma atributos de `liquid-data` em scripts `application/json`. Aplicar `escape` nesse contexto deixa entidades HTML no JSON, e o runtime também não coleta todos os scripts irmãos como props independentes. O tema usa um `div.island-bridge` comum com `data-liquid-store="{{ product | json | escape }}"`. O navegador decodifica o atributo e o runtime recebe o objeto. Os dados continuam protegidos no contexto HTML.
4. **Template literals em atributos.** Uma expressão como `` href={`${routes.root_url}#essencia`} `` produziu `&quot;` dentro da expressão Liquid gerada. Nesses casos, o tema usa a interpolação Liquid diretamente no atributo.
5. **Elementos HTML não vazios autoencerrados.** `<span />` foi emitido literalmente. O navegador manteve o span aberto e colocou o texto seguinte dentro dele. O tema usa `<span></span>` para spans vazios e fechamento explícito no `textarea` do formulário de contato. O verificador do build detecta esses casos.
6. **Atributos booleanos dinâmicos.** `checked={value.active}` produziu `checked="false"`, que ainda marca um checkbox no HTML. `checked={value.active === true}` produz uma condição Liquid envolvendo a presença do atributo.
7. **Métodos em atribuições condicionais.** `const heading = condition ? current_tags.join(' + ') : collection.title` deixou `.join()` na saída Liquid; a Shopify rejeitou o upload. A saída do título agora usa uma condição JSX e o filtro Liquid `join` diretamente.
8. **Nomes de atributos SVG.** `strokeWidth`, `strokeLinecap` e `strokeLinejoin` foram convertidos para nomes em minúsculas sem hífen. O snippet SVG usa os nomes nativos `stroke-width`, `stroke-linecap` e `stroke-linejoin`.
9. **Escopo da paginação.** O objeto `paginate` é passado explicitamente como `pager` ao snippet, para preservar o escopo ao usar `render`.
10. **Tamanho de página configurável.** O tema usa `by="section.settings.products_per_page"` para gerar a expressão Liquid do tamanho da página. A biblioteca local já declara `by` como `number | string`, portanto o adaptador de tipagem da cópia original foi removido. O build verifica tamanhos vazios.
11. **Expressões lógicas em atributos booleanos.** `disabled={!available || requires_plan}` vira um atributo textual inválido. O fallback usa um `fieldset` com comparação explícita para o plano obrigatório e mantém a condição simples de disponibilidade no botão. As verificações também cobrem atributos booleanos inválidos nos snippets.
12. **Tags Liquid em strings com filtros.** Uma string JSX contendo `{% assign ... | default: ... %}` é envolvida em `{{ ... }}` por conter `|`. A seção declara a variável em TSX (`const selected_sort = collection.sort_by || collection.default_sort_by`) para gerar o `assign`. Strings contendo filtros ficam reservadas a expressões de saída. O verificador detecta tags envolvidas em outra saída Liquid.

O Theme Check pode apontar avisos `UndefinedObject` para os flags `script_*_loaded` inseridos pelo compilador. São os guardas de carregamento dos bundles; eles começam como `nil` no Liquid. A validação local não substitui a conferência dos fluxos na prévia Shopify.

## Referências da integração

As operações de adicionar, alterar quantidade e obter a sacola seguem a [Ajax Cart API da Shopify](https://shopify.dev/docs/api/ajax/reference/cart). A composição usa [templates de tema Shopify](https://shopify.dev/docs/storefronts/themes/architecture/templates), e o catálogo usa os [filtros de storefront](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering).
