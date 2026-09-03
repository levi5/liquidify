# Liquidify Library Documentation

Esta pasta contém o núcleo do Liquidify, um compilador que transforma componentes JSX/TSX em código Liquid para Shopify.

## Documentação Detalhada

Para detalhes técnicos profundos, consulte os documentos específicos:

- [**Arquitetura Core (Domínio)**](CORE.md): Entidades e protocolos.
- [**Lógica de Parser (Babel)**](PARSER_LOGIC.md): Transformação JSX para Liquid.
- [**Extração e Hidratação**](COMPONENT_EXTRACTION.md): Como o JS do cliente é isolado.
- [**Algoritmos Complexos**](COMPLEX_ALGORITHMS.md): Detalhes sobre recursividade e manipulação de AST.
- [**Adaptadores de Infra**](INFRA_ADAPTERS.md): Compiladores (Esbuild/React) e FileSystem.
- [**Serviços e Fluxo**](APPLICATION.md): Orquestração da transpilação.


---

## Mapeamento de Arquivos Principais

### `lib/infra/adapters/parsers/babel/`
- **`ASTParser.ts`**: Wrapper sobre o parser do Babel.
- **`babel-parser.ts`**: Adaptador principal que coordena o fluxo de análise.
- **`liquid-parser.ts`**: Orquestrador da conversão JSX -> Liquid.
- **`liquid/`**: Sub-parsers para atributos, expressões, loops, etc.

### `lib/application/services/`
- **`transpile-file.ts`**: Pipeline de leitura, parse e gravação.
- **`validation-service.ts`**: Validador de regras do framework.

---

## Filosofia de Código

- **Clean Architecture**: Separação clara entre domínio, aplicação e infraestrutura.
- **Injeção de Dependência**: Facilitar testes e manutenibilidade.
- **Documentação Externa**: A documentação reside em arquivos `.md`, mantendo o código limpo (sem comentários internos).
