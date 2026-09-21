# Compilação, imports e watch

## Build incremental

Depois do primeiro `builder.build()`, a mesma instância reutiliza o runtime e recompila componentes cujo conteúdo ou dependências mudaram. O rastreamento acompanha imports e reexports locais, imports dinâmicos com caminho literal, `require()` com caminho literal e imports de CSS/SCSS. Dependências externas à pasta de componentes também entram no watch. Alterações no registro de componentes podem exigir reconstruir todos os componentes para atualizar referências e scripts.

O cache de compilação fica em memória. Uma nova instância faz um build completo. A resolução não acompanha caminhos calculados dinamicamente nem alterações em pacotes instalados em `node_modules`.

Para encerrar o watch e aguardar o fechamento dos observadores:

```ts
await builder.dispose()
```

`disposeSync()` continua disponível para compatibilidade com a CLI.

## Saídas geradas e limpeza

Cada build concluído registra os arquivos gerados em `.liquidify-manifest.json`, dentro da pasta de saída. Mantenha esse arquivo local entre builds; ele não deve ser publicado no tema nem versionado.

Ao remover ou renomear um componente, o próximo build remove saídas antigas registradas no manifesto. Um arquivo só é apagado se seu conteúdo ainda coincidir com a versão gerada. Arquivos editados manualmente e arquivos não registrados são preservados. A limpeza também funciona após reiniciar o compilador.

Scripts globais e CSS compartilhado usam trechos delimitados por comentários `liquidify:start` e `liquidify:end`. Conteúdo fora desses trechos é preservado. Não edite manualmente os trechos gerenciados.

Arquivos antigos criados antes da adoção do manifesto não são apagados automaticamente. Referências globais antigas sem os delimitadores também são preservadas; retire referências obsoletas uma vez ao migrar.

A escrita das saídas dos componentes é adiada até a compilação e a validação de todos os componentes selecionados terminarem. Erros de compilação preservam as saídas anteriores. Isso não constitui uma transação de filesystem: falhas de escrita no disco ainda podem interromper a gravação final.

## Imports de dados e schemas

O parser Liquid e o extrator de schemas compartilham a resolução de:

- Caminhos relativos, extensões `.ts`, `.tsx`, `.js`, `.jsx` e arquivos `index`.
- Aliases `compilerOptions.paths` e `baseUrl` do `tsconfig.json` mais próximo.
- Herança de configuração por `extends` com caminho relativo.
- Exports nomeados, default, reexports nomeados e `export *`.
- Objetos e arrays estáticos, identificadores locais, spreads e `as const`.

Ciclos entre imports e reexports geram um diagnóstico. A resolução estática de dados não executa funções nem substitui o bundler JavaScript. Herança de tsconfig por nome de pacote e exportações namespace não fazem parte deste suporte.

## Expressões e diagnósticos

Strings mantêm sua pontuação e operadores literais. Aritmética aninhada utiliza variáveis temporárias quando necessário para preservar a ordem de avaliação. Condições com `&&` e `||` combinados são convertidas em condições Liquid aninhadas.

`.find()` em expressões aceita uma arrow function inline com um parâmetro simples e corpo de expressão, por exemplo `items.find(item => item.available)`. Referências de função como `items.find(predicate)` e callbacks com bloco são rejeitados com uma mensagem explicativa.

Erros sintáticos e diagnósticos de `.find()` incluem `filePath` e `location` com linha e coluna começando em 1. A CLI apresenta essas posições quando disponíveis. Nomes de componentes que colidem e arquivos de saída reservados também geram erros, em vez de sobrescrita silenciosa.
