# LiquidX 🚀

> **Status:** Projeto em andamento (Alpha v0.0.1)

LiquidX é um compilador avançado que transforma componentes **JSX/TSX** em código **Liquid** para Shopify, utilizando o Babel e esbuild.

---

## 🚀 Como Executar

### Desenvolvimento Local

Para rodar o LiquidX diretamente do código fonte (usando `tsx`):

```bash
# Executa o comando build do CLI
npm run liquidx -- build

# Executa o modo watch
npm run liquidx -- watch
```

### Gerando o Build

Para compilar o código TypeScript em JavaScript (gerando a pasta `dist`):

```bash
npm run build
```

---

## 🔗 Utilizando via `npm link`

Se você deseja usar o LiquidX em outro projeto localmente para testar:

### 1. No repositório do LiquidX:

Primeiro, gere o build e crie o link global:

```bash
npm run build
cd dist
npm link
```

### 2. No projeto de destino:

Vá até a pasta do seu tema ou projeto onde deseja usar o LiquidX e execute (recomenda-se apagar a pasta `node_modules` antes de rodar o comando):

```bash
# Apague os módulos antigos (opcional, mas recomendado)
rm -rf node_modules

# Crie o link para o LiquidX
npm link liquidx
```

Agora você pode usar o comando `liquidx` diretamente no terminal do seu projeto de destino!

---

## 📚 Documentação Adicional

Para entender a arquitetura e o funcionamento interno, consulte a [Documentação Técnica](lib/docs/README.md).
