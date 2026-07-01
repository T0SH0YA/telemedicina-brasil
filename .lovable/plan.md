## Diagnóstico

Rodei a checagem de tipos (`tsgo`) no projeto e encontrei **1 erro** que quebra o build:

```
src/components/documents/receita-form.tsx(82,54): error TS2345:
Argument of type 'string | null' is not assignable to parameter of type 'string | undefined'.
```

### Causa

Na linha 82, ao adicionar um medicamento, chamamos:

```ts
sugerirApresentacao(m.substancia, m.produto)
```

Mas `m.substancia` é do tipo `string | null` (vem da base ANVISA), enquanto a função `sugerirApresentacao(substancia?: string, produto?: string)` só aceita `string | undefined`. O TypeScript rejeita o `null`.

## Correção

Converter o `null` para `undefined` na chamada (dado `m.produto` já é `string`):

```ts
form: [
  m.apresentacao || sugerirApresentacao(m.substancia ?? undefined, m.produto),
  m.laboratorio,
].filter(Boolean).join(" · "),
```

Isso mantém o comportamento atual (usa a apresentação sugerida quando a base não traz concentração) e satisfaz o tipo da função.

## Verificação

1. Rodar `tsgo` novamente e confirmar 0 erros.
2. Confirmar que o preview carrega sem overlay do Vite e sem erros no console.

## Observação

É uma correção pontual de tipagem, sem mudança de comportamento. O restante do código passou na checagem de tipos.
