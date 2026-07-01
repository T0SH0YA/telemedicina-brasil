## Diagnóstico

O app não está compilando. O preview mostra o overlay de erro do Vite porque há um **erro de sintaxe** em `src/lib/posology.ts` (linha 168), dentro da função `formatPosology`:

```js
base += `${" "}".trim() + " " + s.duracao;
```

Essa linha mistura um template literal (crase) com aspas duplas e nunca fecha a string corretamente, gerando `[PARSE_ERROR] Expected a semicolon...`. Como esse arquivo entra na cadeia de imports do app inteiro, **nada renderiza**.

## Correção

1. Substituir a linha 168 por uma concatenação simples e válida, adicionando a duração após um espaço:
   ```js
   base += " " + s.duracao;
   ```
   (o `.trim()` final já existe no `return`, então não é necessário aqui).

## Verificação

2. Confirmar que o erro sumiu dos logs do dev server / overlay do Vite.
3. Rodar checagem de tipos (`tsgo`) no arquivo para garantir que não há outros problemas.
4. Abrir o preview e confirmar que a tela carrega normalmente (login → app), sem erros de console.

## Observação

É uma correção pontual de 1 linha, sem mudança de comportamento — apenas restaura a montagem correta da string de posologia (ex.: "... por 7 dias"). Depois disso posso fazer uma verificação end-to-end das telas principais (Dashboard, Novo documento, Histórico, Pacientes) se você quiser.
