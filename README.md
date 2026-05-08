# Meu Portfólio

Aplicação React para acompanhamento de investimentos na B3 e Bolsa Americana.

## Funcionalidades

- Carteira de ativos com preços em tempo real (via HG Brasil API)
- Acompanhamento de operações (compras e vendas)
- Controle de dividendos
- Cálculo de PnL e indicador de Graham
- Alertas de preço
- Relatórios e estatísticas

## Tecnologias

- React 18 + TypeScript
- Tailwind CSS
- Recharts
- React Router
- HG Brasil API (cotações B3)
- Yahoo Finance (cotações US)

## Configuração

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Variáveis de Ambiente

A API key da HG Brasil está configurada no arquivo `src/services/marketApi.ts`.

## Deploy

Este projeto pode ser deployado no GitHub Pages, Netlify ou Vercel.
