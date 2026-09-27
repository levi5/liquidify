# web/ — doc do Liquidify (Vite + React + TS, GitHub Pages)

Site da documentação, publicado no GitHub Pages via
`.github/workflows/pages.yml` (build de `web/` → artifact `web/dist`).

## Estrutura de componentes

Cada componente mora em `src/components/<Nome>/` com o par
`index.tsx` + `style.css`:

```txt
web/
├── index.html              # entry do Vite
├── vite.config.ts          # base '/liquidify/' (URL do Pages)
├── package.json
├── public/.nojekyll
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css           # variáveis, base, botões, tabelas, code
    └── components/
        ├── Header/         # index.tsx + style.css
        ├── Hero/           # home: pipeline TSX→Liquid + features
        ├── StoreDemo/      # example: showcase curado (sem file viewer)
        ├── GettingStarted/ # docs/start
        ├── DocsGuide/      # docs/theme-model
        ├── AuthoringGuide/ # docs/authoring
        ├── Directives/
        ├── ShopifyGuide/
        ├── Builtins/
        ├── RuntimeGuide/
        ├── AdvancedIslands/ # docs/islands (de docs/react-events.md)
        ├── BuildDeep/      # api/build (de docs/compiler-build.md)
        ├── CliReference/
        ├── ConfigReference/
        ├── CliApi/
        ├── ApiGuide/
        ├── GuideNav/
        ├── Figures/        # diagramas dos Docs (pipeline, island, editor)
        ├── Snippet/
        ├── CodeBlock/
        └── Footer/
```

Fotos da loja em `public/store/` (copiadas do template example).```

## Comandos

```bash
# --ignore-workspace: o site é independente do workspace pnpm da raiz
pnpm --dir web install --ignore-workspace
pnpm --dir web dev       # preview local com HMR
pnpm --dir web build     # typecheck + build → web/dist
pnpm --dir web preview   # serve o build localmente
```

## Publicar no GitHub Pages

1. Commit + push na `master`.
2. No GitHub: **Settings → Pages → Source: GitHub Actions**.
3. URL final: `https://<user>.github.io/liquidify/`.
