# CTI Global — Portal de Inteligência e Planejamento Financeiro (Corporate FP&A)

**Diretoria Financeira & Controladoria • CTI Global**  
**Escopo Consolidado:** 1.200 cenários estocásticos × 12 anos projetados (`14.400` registros por demonstração financeira: Balanço Patrimonial, DRE e Fluxo de Caixa)

---

## 1. Visão Geral da Plataforma

O **Portal de Inteligência e Planejamento Financeiro da CTI Global** centraliza o acompanhamento executivo de resultados operacionais, geração de caixa, estrutura de capital, metas corporativas (OKRs), economia unitária comercial (*Unit Economics*) e simulações de sensibilidade (*What-If*).

### Módulos Executivos

1. **Visão Financeira & Evolução (`Anos 1 a 12` / `Anos 1 a 11`)**
   - **Margens e Resultado (DRE):** Receita Bruta, Receita Líquida (`Receita + Tributos`), Custos Variáveis (`|DRE - Custos|`), **Margem de Contribuição**, **EBITDA Calculado** (`Resultado Operacional + |D&A|`), **Margem EBITDA Calculada**, **EBITDA do Modelo** e **Margem EBITDA do Modelo**.
   - **Criação de Valor Econômico (EVA / ROIC):** **NOPAT** (`Resultado Operacional × (1 - |IR/CSLL| / |LAIR|)`), **Capital Investido** (`|PC| + |PNC| + |PL|`), **ROIC** (`NOPAT / Capital Investido`) e **EVA** (`NOPAT - Capital Investido × WACC`, com custo de capital corporativo base `WACC = 12,0% a.a.`).
   - **Liquidez e Estrutura de Capital (Balanço Patrimonial):** **Liquidez Corrente (`LC`)**, **Liquidez Seca (`LS`)**, **Liquidez Imediata (`LI`)**, **Liquidez Geral (`LG`)**, **Participação de Capital de Terceiros (`PCT`)**, **Composição do Endividamento (`CE`)**, **Imobilização do PL (`IPL`)** e **Endividamento Geral**.
   - **Fluxo de Caixa (DFC):** Geração Livre de Caixa, Investimentos (CAPEX), Distribuição de Dividendos a Acionistas e Saldo Final de Caixa.
2. **Painel de Metas & OKRs Financeiros**
   - Monitoramento executivo com farol semafórico (`Atingida`, `Alerta >= 97%`, `Abaixo da Meta`), apuração de *gap* em `R$` ou `p.p.`, e probabilidade de cumprimento na carteira de **1.200 cenários**.
3. **Ticket Médio, CAC & LTV (*Unit Economics*)**
   - Parâmetros comerciais corporativos de referência:
     - $\text{CAC Comercial} = \frac{\text{Investimento em Aquisição}}{\text{Novos Clientes}} = \mathbf{R\$\ 200,00/\text{cliente}}$
     - $\text{LTV Comercial} = \text{Ticket Médio} \times \text{Compras por Ano} \times \text{Vida Média} \times \text{Margem} = \mathbf{R\$\ 2.100,00/\text{cliente}}$
     - $\text{Relação LTV/CAC} = \frac{2.100}{200} = \mathbf{10,50x}$
   - Simulador comercial de elasticidade a descontos/cupons sobre o Ticket Médio, *Payback* de aquisição (em meses) e base implícita de clientes ativos.
4. **Análise de Sensibilidade (*What-If*)**
   - Simulação em tempo real de choques em **Desconto Comercial / Cupom na Receita (`%`)**, **Volume / Demanda (`%`)**, **Custos Variáveis (`%`)** e **Custo de Capital – WACC (`%`)** sobre Margem de Contribuição, Margem EBITDA, EBITDA, NOPAT e EVA.
   - Cálculo automático do **Volume de Equilíbrio (*Break-Even Volume*)** necessário para preservar a margem em R$ frente a campanhas promocionais.
   - **Matriz de Sensibilidade Bivariada (*Heatmap*)** cruzando `Desconto Comercial (%)` × `Variação de Custos (%)`.
5. **Rankings Estratégicos & Carteira de 1.200 Cenários**
   - Classificação executiva por perfil estratégico (`ALTA RENTABILIDADE`, `ALTA LIQUIDEZ`, `BAIXA LIQUIDEZ`, `RETORNO MODERADO` e `BAIXO RISCO`) e inspeção individual de qualquer cenário de `1` a `1.200`.
6. **Governança de Indicadores & Auditoria Contábil**
   - Catálogo técnico de fórmulas, diretrizes de apuração da Controladoria CTI Global, distribuição estatística (`P5` a `P95`) e exportação corporativa em `CSV` e `PDF`.

---

## 2. Operação e Execução da Plataforma

A arquitetura disponibiliza duas interfaces sincronizadas sobre a mesma base contábil consolidada (`.xlsx`):

### Interface Web Corporativa (`index.html` / `Node.js`)
Execução direta sem dependências externas:
1. Abra `index.html` diretamente no navegador (ou via servidor HTTP local); ou
2. Inicie o serviço corporativo Node.js:
   ```powershell
   node server.js
   ```
   Acesse `http://localhost:3000`.  
   *(Caso a base `.xlsx` no diretório raiz seja atualizada, o serviço sincroniza `dados_planilha.js` automaticamente na inicialização ou via `node scripts/processar_planilha.js`).*

### Interface Analítica Cloud (`app.py` / `Streamlit`)
1. Instale os pacotes necessários:
   ```bash
   pip install -r requirements.txt
   ```
2. Inicie o portal analítico:
   ```bash
   streamlit run app.py
   ```

---

## 3. Governança e Reconciliação de Indicadores Corporativos

| Indicador | Regra de Apuração Contábil | Média Consolidada (`N = 1.200`) | Mediana (`P50`) | Precisão de Auditoria |
| :--- | :--- | :---: | :---: | :---: |
| **Receita Bruta** | `ABS(DRE - Receita)` | R$ 7,55 bi | R$ 7,54 bi | `0.000e+0` |
| **Custos Variáveis (Proxy)** | `ABS(DRE - Custos)` | R$ 1,22 bi | R$ 1,22 bi | `0.000e+0` |
| **Margem de Contribuição** | `(Receita + Tributos - \|Custos\|) / (Receita + Tributos)` | 81,87% | 81,90% | `0.000e+0` |
| **EBITDA Calculado** | `Resultado Operacional + \|Depreciação e Amortização\|` | R$ 5,69 bi | R$ 5,69 bi | `0.000e+0` |
| **Margem EBITDA Calculada** | `EBITDA Calculado / Receita` | 74,96% | 74,99% | `0.000e+0` |
| **EBITDA do Modelo** | `Campo DRE - EBITDA` | R$ 6,06 bi | R$ 6,06 bi | `0.000e+0` |
| **Margem EBITDA do Modelo** | `EBITDA do Modelo / Receita` | 80,00% | 80,01% | `1.110e-16` |
| **NOPAT** | `Resultado Operacional × (1 - \|IR/CSLL\| / \|LAIR\|)` | R$ 3,18 bi | R$ 3,19 bi | `9.537e-7` |
| **Capital Investido** | `ABS(PC) + ABS(PNC) + ABS(PL)` | R$ 12,17 bi | R$ 12,23 bi | `0.000e+0` |
| **EVA (WACC = 12%)** | `NOPAT - (Capital Investido × WACC)` | R$ 1,72 bi | R$ 1,72 bi | `9.537e-7` |
| **ROIC** | `NOPAT / Capital Investido` | 26,21% | 26,10% | `5.551e-17` |
| **Liquidez Corrente (LC)** | `AC / ABS(PC)` | 1,02x | 1,06x | `4.441e-16` |
| **Liquidez Seca (LS)** | `(AC - Estoques) / ABS(PC)` | 1,02x | 1,06x | `4.441e-16` |
| **Liquidez Imediata (LI)** | `Disponível / ABS(PC)` | 0,67x | 0,73x | `2.220e-16` |
| **Liquidez Geral (LG)** | `(AC + RLP) / (ABS(PC) + ABS(PNC))` | 0,34x | 0,34x | `5.551e-17` |
| **PCT** | `(ABS(PC) + ABS(PNC)) / ABS(PL)` | 5,90x | 4,90x | `1.421e-14` |
| **Composição Endiv. (CE)** | `ABS(PC) / (ABS(PC) + ABS(PNC))` | 21,00% | 21,39% | `2.776e-17` |
| **Imobilização do PL (IPL)** | `(Ativo Total - AC) / ABS(PL)` | 4,75x | 3,82x | `4.441e-16` |
| **Endividamento Geral** | `(ABS(PC) + ABS(PNC)) / Ativo Total` | 122,85% | 122,60% | `2.220e-16` |
| **CAC Comercial** | `Investimento em Aquisição / Novos Clientes` | R$ 200,00/cli | R$ 200,00/cli | `0.000e+0` |
| **LTV Comercial** | `Ticket Médio × Compras/Ano × Vida Média × Margem` | R$ 2.100,00/cli | R$ 2.100,00/cli | `0.000e+0` |
| **Relação LTV/CAC** | `LTV / CAC` | 10,50x | 10,50x | `0.000e+0` |
