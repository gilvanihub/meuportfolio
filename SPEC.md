# Consolidador de Ativos - Especificação Técnica

## 1. Visão Geral do Projeto

**Nome do Projeto**: Consolidador de Ativos
**Tipo**: Aplicação Web para Gestão de Portfólio de Investimentos
**Modelo de Negócio**: Plataforma B2C para investidores individuais (buy & hold)

### Funcionalidades Principais
- **Carteira de Ativos**: Visualização consolidada de todos os ativos (B3 e EUA)
- **Desempenho/PnL**: Acompanhamento de lucros e perdas em tempo real
- **Dividendos**: Registro e projeção de rendimentos
- **Histórico de Operações**: Registro completo de compras e vendas
- **Relatórios**: Análises estatísticas e visualizações
- **Alertas de Preço**: Notificações personalizadas
- **Indicador de Graham**: Análise de valuation usando a Fórmula de Graham

### Mercados Suportados
- **B3 (Brasil)**: Ações, ETFs, BDRs, Fiis
- **EUA**: Ações, ETFs (NYSE, NASDAQ)

---

## 2. Design Language

### Paleta de Cores
```css
:root {
  /* Cores Primárias */
  --primary: #1E3A5F;        /* Azul escuro - profissional */
  --primary-light: #2D5A8E;   /* Azul claro */
  --primary-dark: #0F2744;    /* Azul muito escuro */

  /* Cores Secundárias */
  --secondary: #4A90A4;       /* Azul acinzentado */
  --accent: #2ECC71;          /* Verde - positivo/dividendos */

  /* Cores de Status */
  --positive: #27AE60;        /* Verde - lucro/alta */
  --negative: #E74C3C;        /* Vermelho - prejuízo/baixa */
  --warning: #F39C12;         /* Amarelo - alerta */
  --neutral: #7F8C8D;         /* Cinza - neutro */

  /* Cores de Fundo */
  --bg-primary: #FFFFFF;      /* Fundo principal */
  --bg-secondary: #F8F9FA;    /* Fundo secundário */
  --bg-card: #FFFFFF;         /* Fundo de cards */
  --bg-dark: #1A1A2E;        /* Fundo escuro */

  /* Cores de Texto */
  --text-primary: #2C3E50;    /* Texto principal */
  --text-secondary: #7F8C8D;  /* Texto secundário */
  --text-muted: #BDC3C7;      /* Texto desabilitado */
}
```

### Tipografia
- **Família de Fontes**:
  - **Títulos**: Inter (700, 600) - Google Fonts
  - **Corpo**: Inter (400, 500) - Google Fonts
  - **Monospace**: JetBrains Mono - para valores numéricos
- **Tamanhos**:
  - H1: 32px / 2rem
  - H2: 24px / 1.5rem
  - H3: 20px / 1.25rem
  - H4: 16px / 1rem
  - Body: 14px / 0.875rem
  - Small: 12px / 0.75rem

### Sistema de Espaçamento
- Base: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Sombras
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
```

### Animações
- **Transições**: 200ms ease-in-out
- **Hover**: scale(1.02) + box-shadow
- **Loading**: skeleton animation pulse
- **Gráficos**: 500ms ease-out para entrada de dados

---

## 3. Layout & Estrutura

### Arquitetura de Páginas

#### Header (Navegação Principal)
```
┌─────────────────────────────────────────────────────────┐
│  📈 Consolidador   │ Dashboard │ Carteira │ ... │ ⚙️   │
└─────────────────────────────────────────────────────────┘
```

**Navegação Principal**:
1. Dashboard (página inicial)
2. Carteira
3. Operações
4. Dividendos
5. Relatórios
6. Configurações

#### Dashboard (Página Inicial)
```
┌─────────────────────────────────────────────────────────┐
│  RESUMO DO PORTFÓLIO                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Valor Total │ │ PnL Total    │ │ Divid. YTD  │    │
│  │ R$ XXX.XXX  │ │ +R$ X.XXX    │ │ R$ X.XXX    │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  COMPOSIÇÃO DO PORTFÓLIO                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Gráfico de Pizza / Barras]                     │  │
│  │  B3: XX%  │  EUA: XX%                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  MAIORES POSIÇÕES                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ativo    │ Qtd │ Preço   │ Valor   │ PnL  │ Grf │  │
│  │ PETR4    │ 100 │ 38,50   │ 3.850   │ +5%  │ ▓▓░│  │
│  │ VALE3    │ 50  │ 68,20   │ 3.410   │ -2%  │ ▓░░│  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  INDICADOR DE GRAHAM                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ativo   │ Preço │ VPA   │ LPA  │ Graham │ Status │  │
│  │ PETR4   │ 38,50 │ 35,00 │ 4,50 │ 55,00  │ 📉Barato│  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Página da Carteira
```
┌─────────────────────────────────────────────────────────┐
│  CARTEIRA DE ATIVOS                         [+ Adicionar]│
│  ─────────────────────────────────────────────────────  │
│  Filtros: [Mercado ▼] [Setor ▼] [Status ▼] [🔍 Buscar] │
│  ─────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ativo │ Tipo │ Qtd │ Prç.Méd │ Preço │ Valor │PnL│ │
│  ├──────────────────────────────────────────────────┤  │
│  │ PETR4 │ ON   │ 100 │ 35,20   │ 38,50 │ 3.850│+9%│ │
│  │ VALE3 │ ON   │ 50  │ 70,00   │ 68,20 │ 3.410│-3%│ │
│  │ AAPL  │ US   │ 20  │ 145,00  │ 178,00│3.560$│+23│ │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Indicador de Graham por Ativo                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PETR4 │ Preço Atual: R$38,50                     │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░ 70% do valor   │  │
│  │ Valor Graham: R$55,00 │ Status: ABAIXO (Barato) │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Página de Operações
```
┌─────────────────────────────────────────────────────────┐
│  HISTÓRICO DE OPERAÇÕES                      [+ Nova]    │
│  ─────────────────────────────────────────────────────  │
│  Filtros: [Tipo ▼] [Ativo ▼] [Período ▼] [Exportar]    │
│  ─────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Data    │ Ativo │ Tipo │ Qtd │ Preço │ Total  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 15/01/24│ PETR4 │ Comp │ 100 │ 35,20 │ 3.520  │  │
│  │ 10/01/24│ VALE3 │ Comp │ 50  │ 70,00 │ 3.500  │  │
│  │ 05/01/24│ AAPL  │ Comp │ 20  │ 145,00│ 2.900$ │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Página de Dividendos
```
┌─────────────────────────────────────────────────────────┐
│  CONTROLE DE DIVIDENDOS                                  │
│  ─────────────────────────────────────────────────────  │
│  RESUMO ANUAL                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ 2024    │ │ 2023    │ │ 2022    │ │ Proj.24 │      │
│  │ R$2.450 │ │ R$1.890 │ │ R$1.200 │ │ R$2.800 │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  PROVENTOS RECEBIDOS                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Data    │ Ativo │ Tipo  │ Qtd   │ Valor │ Rend.│  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 15/01/24│ PETR4 │ JCP   │ 100   │ 150,00│ 135,00│  │
│  │ 10/01/24│ VALE3 │ Divid │ 50    │ 85,00 │ 76,50 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Página de Relatórios
```
┌─────────────────────────────────────────────────────────┐
│  RELATÓRIOS E ESTATÍSTICAS                              │
│  ─────────────────────────────────────────────────────  │
│  ┌─────────────────┐ ┌─────────────────┐               │
│  │ Evolução do     │ │ Diversificação  │               │
│  │ Patrimônio      │ │ por Setor       │               │
│  │ [Gráfico Linha]  │ │ [Gráfico Pizza]  │               │
│  └─────────────────┘ └─────────────────┘               │
│  ┌─────────────────┐ ┌─────────────────┐               │
│  │ Rentabilidade   │ │ Proventos por   │               │
│  │ por Ativo       │ │ Mês/Ano         │               │
│  │ [Gráfico Barras] │ │ [Gráfico Barras] │               │
│  └─────────────────┘ └─────────────────┘               │
│                                                         │
│  ESTATÍSTICAS GERAIS                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Taxa de Retorno Total: +18,5%                    │  │
│  │ Dividend Yield Médio: 6,2%                       │  │
│  │ Maior Alta: PETR4 (+25%)                         │  │
│  │ Maior Queda: VALE3 (-8%)                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Página de Alertas
```
┌─────────────────────────────────────────────────────────┐
│  ALERTAS DE PREÇO                            [+ Criar]   │
│  ─────────────────────────────────────────────────────  │
│  ALERTAS ATIVOS                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PETR4 │ Acima de R$40,00 │ 📈 Disparado! │ ✓    │  │
│  │ VALE3 │ Abaixo de R$65,00│ 📉 Atenção!   │ ✓    │  │
│  │ AAPL  │ Acima de $180,00 │ 📈 Alert      │ ✗    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Página de Configurações
```
┌─────────────────────────────────────────────────────────┐
│  CONFIGURAÇÕES                                          │
│  ─────────────────────────────────────────────────────  │
│  GERAL                                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Moeda Base: [BRL ▼]                              │  │
│  │ Fuso Horário: [America/São_Paulo ▼]              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  APIs                                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Status: Conectado ✓                              │  │
│  │ Última atualização: há 5 minutos                 │  │
│  │ [Reconectar]                                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  DADOS                                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Exportar Dados]  [Importar Dados]  [Limpar Tudo]│  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Estratégia Responsiva

**Desktop (>1200px)**: Layout completo, 3 colunas
**Tablet (768-1199px)**: Layout adaptado, 2 colunas
**Mobile (<768px)**: Layout empilhado, navegação hamburger

---

## 4. Features & Interações

### 4.1 Gestão de Ativos

#### Adicionar Ativo
1. Clique em "+ Adicionar Ativo"
2. Modal abre com campos:
   - Código do ativo (autocomplete com sugestões)
   - Mercado (B3/EUA)
   - Tipo (Ação, ETF, BDR, FII)
   - Quantidade
   - Preço de compra
   - Data da compra
3. Validação em tempo real
4. Confirmação com feedback visual

#### Editar Ativo
- Clique no ativo → Modal de edição
- Campos pré-preenchidos
- Validação idêntica à adição

#### Remover Ativo
- Modal de confirmação
- Opção de venda total ou parcial

### 4.2 Registro de Operações

#### Nova Operação (Compra)
1. Selecionar ativo (existente ou novo)
2. Tipo: Compra
3. Quantidade
4. Preço unitário
5. Data
6. Corretora (opcional)
7. Observações (opcional)

#### Nova Operação (Venda)
- Mesmo fluxo, tipo "Venda"
- Atualiza quantidade e PnL automaticamente

### 4.3 Indicador de Graham

#### Fórmula de Benjamin Graham
```
VNG = √(22,5 × LPA × VPA)

Onde:
- VNG = Valor Nomeal Graham
- LPA = Lucro Por Ação (últimos 12 meses)
- VPA = Valor Patrimonial Por Ação
- 22,5 = Constante de Graham (considera taxa de juros de 4,4%)
```

#### Interpretação
- **Preço < VNG**: Ativo SUBVALORIZADO (abaixo do justo)
- **Preço = VNG**: Ativo no preço justo
- **Preço > VNG**: Ativo SUPERVALORIZADO (acima do justo)

#### Visualização
```
┌────────────────────────────────────────────────────┐
│ Ativo: PETR4                                       │
│ Preço Atual: R$ 38,50                              │
│ VPA: R$ 35,00                                      │
│ LPA: R$ 4,50                                       │
│                                                    │
│ Valor Graham: R$ 55,00                             │
│                                                    │
│ ████████████░░░░░░░░  70% do valor justo         │
│                                                    │
│ Status: 📉 ABAIXO DO JUSTO (Barato)               │
└────────────────────────────────────────────────────┘
```

#### Indicador Visual
- **Verde (0-70%)**: Barato, boa oportunidade
- **Amarelo (70-100%)**: Preço justo
- **Vermelho (>100%)**: Caro, sobrevalorizado

### 4.4 Acompanhamento de Dividendos

#### Registro de Proventos
- Ativo
- Data do crédito
- Tipo (Dividendo, JCP, Rendimento)
- Valor bruto
- Retenção (IRRF)

#### Projeção
- Base em dividendos históricos
- Projeção mensal/anual
- Dividend yield por ativo

### 4.5 Sistema de Alertas

#### Tipos de Alerta
1. **Preço Acima**: Notifica quando ativo atingir valor mínimo
2. **Preço Abaixo**: Notifica quando ativo cair abaixo de valor
3. **Variação %**: Notifica quando ativo variar X% em 24h

#### Configuração
- Ativo
- Tipo de alerta
- Valor/percentual
- Frequência (uma vez, diário, sempre)

#### Notificações
- Toast notifications no navegador
- Badge no ícone de alertas
- Lista de alertas disparados

### 4.6 Integração com API

#### Provedor de Dados
- **Yahoo Finance** (via API não-oficial) - gratuito
- **Alpha Vantage** - gratuito com API key
- Dados em tempo real (15min delay)

#### Dados Capturados
- Preço atual
- Variação diária
- LPA e VPA (para Graham)
- Dividendos históricos

#### Cache Local
- Dados armazenados em localStorage
- Refresh a cada 15 minutos
- Indicador de última atualização

### 4.7 Relatórios

#### Tipos de Relatório
1. **Evolução Patrimonial**: Gráfico de linha temporal
2. **Diversificação**: Pizza por setor/ativo/mercado
3. **Rentabilidade**: Barras por ativo
4. **Proventos**: Barras por mês/ano
5. **Métricas**: ROI, dividend yield, maior alta/baixa

#### Exportação
- PDF (relatório mensal)
- CSV (dados detalhados)

---

## 5. Component Inventory

### 5.1 Navegação

#### Navbar
- **Default**: Fundo branco, texto primary
- **Hover**: Background primary-light (10% opacity)
- **Active**: Borda inferior primary, texto bold
- **Mobile**: Hamburger menu com slide-in

### 5.2 Cards

#### Card de Resumo
```
┌─────────────────────────┐
│  📊 Título              │
│  ─────────────────────  │
│  R$ 125.450,00          │
│  +12,5% ↑               │
└─────────────────────────┘
```
- **Default**: Sombra sm, border-radius 12px
- **Hover**: Sombra md, translateY(-2px)

#### Card de Ativo
```
┌─────────────────────────────────────┐
│ PETR4  │ ON │ ● 100 ações           │
│ ────────────────────────────────    │
│ Preço: R$ 38,50                     │
│ Média: R$ 35,20                     │
│ Valor: R$ 3.850,00                  │
│ PnL: +9,3% ✅                       │
│ Graham: 70% 📉 Barato               │
└─────────────────────────────────────┘
```
- **Default**: Borda esquerda colorida (verde/vermelho)
- **Hover**: Elevação, cursor pointer
- **Selected**: Borda primary, fundo primary (5%)

### 5.3 Botões

#### Botão Primário
- **Default**: bg-primary, texto branco, rounded-lg
- **Hover**: bg-primary-dark, sombra md
- **Active**: scale(0.98)
- **Disabled**: bg-gray-300, cursor not-allowed
- **Loading**: Spinner + texto "Salvando..."

#### Botão Secundário
- **Default**: bg-white, border primary, texto primary
- **Hover**: bg-primary (5%)
- **Active**: scale(0.98)

#### Botão de Ícone
- **Default**: Circular, 40x40, ícone centralizado
- **Hover**: bg-gray-100

### 5.4 Formulários

#### Input de Texto
- **Default**: Border gray-300, rounded-md, padding 12px
- **Focus**: Border primary, ring primary (20%)
- **Error**: Border red, texto erro abaixo
- **Disabled**: bg-gray-100, cursor not-allowed

#### Select
- **Default**: Similar ao input
- **Open**: Dropdown com sombras, max-height 300px
- **Option Hover**: bg-gray-100

#### Checkbox/Radio
- **Unchecked**: Border gray-300
- **Checked**: bg-primary, checkmark branco
- **Hover**: Border primary

### 5.5 Tabelas

#### Tabela de Dados
```
┌────────────────────────────────────────────────────┐
│ Ativo │ Quantidade │ Preço │ Valor     │ PnL     │
├───────┼────────────┼────────┼───────────┼─────────┤
│ PETR4 │ 100        │ 38,50  │ R$3.850   │ +9,3% ✅│
│ VALE3 │ 50         │ 68,20  │ R$3.410   │ -2,6% ❌│
└────────────────────────────────────────────────────┘
```
- **Header**: bg-gray-50, texto bold
- **Row**: Hover bg-gray-50
- **Row Hover**: bg-primary (5%)
- **Pagination**: 10/20/50 itens por página

### 5.6 Gráficos

#### Gráfico de Linha (Recharts)
- Área preenchida com gradiente
- Linha com 2px stroke
- Tooltip com valores
- Legenda interativa

#### Gráfico de Pizza/Donut
- Cores distintas por segmento
- Hover: explode 5px
- Tooltip com valor e percentual
- Centro com total (donut)

#### Gráfico de Barras
- Barras arredondadas (4px)
- Hover: opacity 80%
- Valor no topo da barra

### 5.7 Modais

#### Modal de Confirmação
```
┌─────────────────────────────────┐
│  ⚠️ Confirmar Exclusão         │
│  ───────────────────────────   │
│  Deseja realmente excluir      │
│  o ativo PETR4?                 │
│                                 │
│  [Cancelar]  [Excluir]         │
└─────────────────────────────────┘
```
- **Overlay**: bg-black (50%)
- **Container**: bg-white, rounded-xl, shadow-lg
- **Animation**: Fade in + scale from 95%

### 5.8 Toasts/Notificações

```
┌────────────────────────────────┐
│ ✅ Ativo salvo com sucesso!   │
│ ═══════════════════════════════│
│ PETR4 adicionado à carteira   │
└────────────────────────────────┘
```
- **Success**: Borda esquerda verde
- **Error**: Borda esquerda vermelha
- **Warning**: Borda esquerda amarela
- **Position**: Bottom-right
- **Duration**: 5s auto-dismiss

### 5.9 Indicadores de Status

#### Badge de PnL
- **Positivo**: bg-green-100, texto green, seta ↑
- **Negativo**: bg-red-100, texto red, seta ↓
- **Neutro**: bg-gray-100, texto gray

#### Indicador de Graham
```
┌──────────────────────────────┐
│ ████████░░░░░░░░  70%       │
│ Barato                       │
└──────────────────────────────┘
```
- **0-70%**: bg-green-100, texto "Barato"
- **70-100%**: bg-yellow-100, texto "Justo"
- **>100%**: bg-red-100, texto "Caro"

---

## 6. Technical Approach

### 6.1 Stack Tecnológico

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Date Picker**: react-day-picker
- **Armazenamento**: localStorage (sem backend)

#### APIs
- **Yahoo Finance** (via pacote yfinance)
- **Alpha Vantage** (backup)
- Dados em cache local com TTL

### 6.2 Arquitetura de Dados

#### Modelo de Dados

```typescript
interface Asset {
  id: string;
  symbol: string;           // ex: "PETR4", "AAPL"
  name: string;             // ex: "Petrobras PN"
  market: 'B3' | 'US';      // Mercado
  type: 'stock' | 'etf' | 'bdr' | 'fiif';  // Tipo
  quantity: number;         // Quantidade atual
  averagePrice: number;     // Preço médio ponderado
  sector?: string;          // Setor (opcional)
  createdAt: string;
  updatedAt: string;
}

interface Operation {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  broker?: string;
  notes?: string;
  createdAt: string;
}

interface Dividend {
  id: string;
  assetId: string;
  date: string;
  type: 'dividend' | 'jcp' | 'rendimento';
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
}

interface PriceAlert {
  id: string;
  assetId: string;
  type: 'above' | 'below' | 'change';
  value: number;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

interface MarketData {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  vpa?: number;             // Valor patrimonial por ação
  lpa?: number;              // Lucro por ação
  dividendYield?: number;
  lastUpdated: string;
}
```

#### Armazenamento Local

```typescript
// localStorage keys
const STORAGE_KEYS = {
  ASSETS: 'consolidator_assets',
  OPERATIONS: 'consolidator_operations',
  DIVIDENDS: 'consolidator_dividends',
  ALERTS: 'consolidator_alerts',
  SETTINGS: 'consolidator_settings',
  MARKET_CACHE: 'consolidator_market_data'
};
```

### 6.3 Estrutura de Pastas

```
src/
├── components/
│   ├── ui/              # Componentes base (Button, Input, Card)
│   ├── layout/          # Navbar, Sidebar, Layout
│   ├── charts/          # Gráficos customizados
│   └── features/        # Feature-specific components
├── pages/
│   ├── Dashboard.tsx
│   ├── Portfolio.tsx
│   ├── Operations.tsx
│   ├── Dividends.tsx
│   ├── Reports.tsx
│   ├── Alerts.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useAssets.ts
│   ├── useOperations.ts
│   ├── useMarketData.ts
│   └── useGrahamIndicator.ts
├── services/
│   ├── storage.ts        # localStorage helpers
│   ├── marketApi.ts      # Chamadas à API
│   └── calculations.ts   # Cálculos financeiros
├── utils/
│   ├── formatters.ts     # Formatadores de moeda/data
│   └── validators.ts    # Validações
├── types/
│   └── index.ts          # TypeScript interfaces
└── App.tsx
```

### 6.4 Cálculos Financeiros

```typescript
// Graham Formula
const calculateGrahamValue = (lpa: number, vpa: number): number => {
  return Math.sqrt(22.5 * lpa * vpa);
};

// Preço médio ponderado
const calculateAveragePrice = (operations: Operation[]): number => {
  const totalCost = operations.reduce((sum, op) => {
    return sum + (op.type === 'buy' ? op.quantity * op.price : 0);
  }, 0);
  const totalQuantity = operations.reduce((sum, op) => {
    return sum + (op.type === 'buy' ? op.quantity : -op.quantity);
  }, 0);
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
};

// PnL percentual
const calculatePnL = (currentPrice: number, averagePrice: number): number => {
  return ((currentPrice - averagePrice) / averagePrice) * 100;
};

// Dividend yield
const calculateDividendYield = (totalDividends: number, currentValue: number): number => {
  return currentValue > 0 ? (totalDividends / currentValue) * 100 : 0;
};
```

### 6.5 Integração com API

```typescript
// Yahoo Finance API (via yfinance)
import yfinance from 'yfinance';

const fetchStockData = async (symbol: string): Promise<MarketData> => {
  const stock = yfinance.Ticker(symbol);
  const info = await stock.info;

  return {
    symbol,
    currentPrice: info.currentPrice || info.regularMarketPrice,
    previousClose: info.previousClose || info.regularMarketPreviousClose,
    change: info.currentPrice - (info.previousClose || info.regularMarketPreviousClose),
    vpa: info.bookValue,
    lpa: info.earningsPerShare,
    dividendYield: info.dividendYield ? info.dividendYield * 100 : 0
  };
};
```

---

## 7. Fluxo de Usuário

### 7.1 Primeiro Uso

1. Usuário acessa a aplicação
2. Vê página de boas-vindas com tutorial rápido
3. Pode adicionar primeiro ativo ou importar dados
4. Dashboard exibe resumo vazio com CTAs

### 7.2 Fluxo Principal

1. **Adicionar Ativo**
   → Dashboard > + Adicionar > Formulário > Salvar

2. **Registrar Compra**
   → Carteira > Selecionar Ativo > Nova Operação > Compra

3. **Acompanhar PnL**
   → Dashboard > Ver Cards de Resumo > Clicar para Detalhe

4. **Verificar Graham**
   → Carteira > Indicador Graham > Ver Detalhamento

5. **Registrar Dividendo**
   → Dividendos > + Registar > Formulário > Salvar

6. **Criar Alerta**
   → Alertas > + Criar > Configurar > Ativar

### 7.3 Exportar Dados

1. **Relatórios** > Selecionar Tipo > Gerar
2. **Exportar** > PDF ou CSV
3. Download automático

---

## 8. Checklist de Implementação

- [ ] Configuração inicial do projeto
- [ ] Tipos TypeScript
- [ ] Componentes UI base
- [ ] Layout e navegação
- [ ] Context API para estado global
- [ ] CRUD de ativos
- [ ] CRUD de operações
- [ ] CRUD de dividendos
- [ ] Sistema de alertas
- [ ] Integração com API (Yahoo Finance)
- [ ] Cálculo de Graham
- [ ] Dashboard com gráficos
- [ ] Página de relatórios
- [ ] Exportação (PDF/CSV)
- [ ] Responsividade mobile
- [ ] Testes básicos
- [ ] Deploy

---

## 9. Notas de Implementação

### Trading Hours
- **B3**: 10:00 - 17:00 (BRT)
- **NYSE/NASDAQ**: 10:30 - 16:00 (ET)

### Rate Limiting
- Yahoo Finance: Não limitado (mas pode bloquear)
- Alpha Vantage: 5 requests/min (free tier)

### Cálculos de Impostos
- IRRF sobre dividendos: 15% (residentes) / 30% (estrangeiros)
- IOF: Isento para ações
- Emolumentos B3: ~0,03%

### Persistência
- Dados locais em localStorage
- Máximo ~5MB (limite localStorage)
- Compressão se necessário