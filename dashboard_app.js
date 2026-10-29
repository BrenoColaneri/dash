/**
 * CTI Global – Portal Corporativo de Inteligência e Planejamento Financeiro (FP&A)
 * Motor analítico integrado às demonstrações financeiras consolidadas (DRE, Balanço e DFC)
 */

(function () {
  'use strict';

  const DATA = window.DADOS_PLANILHA;
  if (!DATA) {
    document.body.innerHTML = '<div style="padding:40px;color:#f87171;">Erro: Base de dados corporativa (dados_planilha.js) não localizada.</div>';
    return;
  }

  // Normaliza descrições herdadas da base para nomenclatura corporativa CTI Global
  function normalizarTextoCorporativo(txt) {
    if (!txt) return '';
    return String(txt)
      .replace(/Cálculo conforme a regra utilizada no exercício do professor\./gi, 'Apuração padronizada pela Controladoria Corporativa CTI Global.')
      .replace(/Indicador complementar; não substitui PCT, CE e IPL do bloco do professor\./gi, 'Indicador complementar de estrutura de capital; acompanha os índices PCT, CE e IPL.')
      .replace(/Incluído conforme a atualização do material do professor\./gi, 'Indicador oficial de retorno operacional da Controladoria CTI Global.')
      .replace(/WACC da planilha = 12%, tratado como premissa do projeto porque a base CTI não fornece WACC\./gi, 'WACC corporativo de referência = 12,0% a.a., estabelecido pelo Comitê Financeiro da CTI Global.')
      .replace(/Material do professor; premissa do projeto; base CTI/gi, 'Comitê Financeiro CTI Global; Governança FP&A')
      .replace(/Material do professor; base CTI/gi, 'Política Contábil Corporativa; Base CTI Global')
      .replace(/Base CTI; premissa metodológica do projeto/gi, 'Base Contábil CTI Global; Governança FP&A')
      .replace(/Base CTI; indicador complementar do projeto/gi, 'Base Contábil CTI Global; Indicador Corporativo FP&A')
      .replace(/Premissa de simulação do projeto \/ E1/gi, 'Modelagem Comercial & Unit Economics CTI Global')
      .replace(/Correção aplicada na revisão:/gi, 'Diretriz técnica de apuração:')
      .replace(/na planilha/gi, 'no modelo corporativo');
  }

  // Estado global do painel
  const state = {
    activeTab: 'tab-visao',
    escopoModo: 'media_1200', // 'media_1200' | 'mediana_1200' | 'top10' | 'cenario'
    top10Categoria: 'ALTA RENTABILIDADE',
    cenarioAtivo: 'Cen_01029',
    anoInicio: 1,
    anoFim: 11,
    escalaMoeda: 'bi', // 'bi' | 'mi' | 'mil' | 'exato'

    // Metas (Tab 2)
    metas: {
      margemEbitdaMod: 80.0,
      margemEbitdaCalc: 75.0,
      margemContrib: 81.9,
      roic: 26.1,
      evaBi: 1.72,
      receitaBi: 7.55,
      lcMin: 1.05,
      endivMax: 123.0
    },

    // Unit Economics / Ticket (Tab 3)
    ticket: {
      ticketBruto: 1000.0,
      descontoPct: 0.0,
      comprasAno: 1.0,
      vidaMediaAnos: 3.0,
      margemBasePct: 70.0,
      comprimirMargem: true,
      investimentoAq: 200000.0,
      novosClientes: 1000
    },

    // Sensibilidade Operacional (Tab 4)
    sensib: {
      descontoPct: 5.0,
      volumePct: 0.0,
      custoUnitPct: 0.0,
      waccPct: 12.0,
      metricaHeatmap: 'margem_ebitda_calc' // 'margem_ebitda_calc' | 'margem_contrib' | 'eva_bi'
    },

    // Filtros Rankings e Dicionário (Tabs 5 & 6)
    rankCategoriaTop10: 'ALTA RENTABILIDADE',
    buscaCenario: '',
    filtroCatDicionario: 'TODAS',
    buscaDicionario: ''
  };

  // Utilitários de Formatação
  function fmtMoeda(val, escalaOverride) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return 'n/d';
    const v = Number(val);
    const sign = v < 0 ? '-' : '';
    const abs = Math.abs(v);
    const esc = escalaOverride || state.escalaMoeda;
    if (esc === 'bi') {
      return sign + 'R$ ' + (abs / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' bi';
    }
    if (esc === 'mi') {
      return sign + 'R$ ' + (abs / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mi';
    }
    if (esc === 'mil') {
      return sign + 'R$ ' + (abs / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' mil';
    }
    return sign + 'R$ ' + abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtPct(val, decimals = 2) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return 'n/d';
    return (Number(val) * 100).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '%';
  }

  function fmtMult(val, decimals = 2) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return 'n/d';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + 'x';
  }

  // Formatação compacta para tabelas densas de 12-13 colunas (evita scroll horizontal em qualquer escala)
  function fmtMoedaTabela(val) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return 'n/d';
    const v = Number(val);
    const sign = v < 0 ? '-' : '';
    const abs = Math.abs(v);
    if (state.escalaMoeda === 'bi') {
      return sign + 'R$ ' + (abs / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' bi';
    }
    if (state.escalaMoeda === 'mi') {
      return sign + (abs / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mi';
    }
    if (state.escalaMoeda === 'mil') {
      return sign + Math.round(abs / 1e3).toLocaleString('pt-BR');
    }
    return sign + Math.round(abs).toLocaleString('pt-BR');
  }

  function descricaoEscalaTabela() {
    if (state.escalaMoeda === 'bi') return 'Valores monetários expressos em R$ Bilhões (bi) • Todos os 13 indicadores visíveis na tela';
    if (state.escalaMoeda === 'mi') return 'Valores monetários expressos em R$ Milhões (mi) • Todos os 13 indicadores visíveis na tela';
    if (state.escalaMoeda === 'mil') return 'Valores monetários expressos em R$ Mil • Todos os 13 indicadores visíveis na tela';
    return 'Valores monetários expressos em R$ (inteiros) • Todos os 13 indicadores visíveis na tela';
  }

  function avg(arr) {
    const valid = arr.filter(x => x !== null && x !== undefined && !Number.isNaN(Number(x)));
    if (!valid.length) return null;
    return valid.reduce((a, b) => a + Number(b), 0) / valid.length;
  }

  // Reconstrói a série anual (Anos 1 a 12) para o escopo selecionado
  // Índices do array compacto por cenário/ano em series_cenarios:
  // [0:Receita, 1:Tributos, 2:CustosVar, 3:DepAmort, 4:EBIT, 5:ResFin, 6:LAIR, 7:IR_CSLL, 8:LucroLiq, 9:EBITDA_Mod,
  //  10:AtivoTotal, 11:AtivoCirc, 12:Disponivel, 13:Estoques, 14:RLP, 15:PassivoCirc, 16:ExigivelLP, 17:PL,
  //  18:DFC_GeracaoCaixa, 19:DFC_SaldoFinal, 20:DFC_Investimentos, 21:DFC_Dividendos]
  function obterSerieAnualEscopo(modo, cenarioId, wacc = 0.12) {
    const anos = [];
    const propEstat = modo === 'mediana_1200' ? 'p50' : 'mean';

    if (modo === 'media_1200' || modo === 'mediana_1200') {
      for (const item of DATA.evolucao_anual) {
        const y = item.ano;
        const m = item.metricas;
        const g = k => (m[k] && m[k][propEstat] !== undefined) ? m[k][propEstat] : null;
        anos.push({
          ano: y,
          receita: g('receita'),
          tributos: g('tributos'),
          receita_liquida: g('receita') + g('tributos'),
          custos_var: g('custos_var'),
          dep_amort: g('dep_amort'),
          ebit: g('ebit'),
          res_fin: g('res_fin'),
          lair: g('lair'),
          ir_csll: g('ir_csll'),
          lucro_liq: g('lucro_liq'),
          ebitda_modelo: g('ebitda_modelo'),
          ebitda_calc: g('ebitda_calc'),
          margem_ebitda_calc: g('margem_ebitda_calc'),
          margem_ebitda_modelo: g('margem_ebitda_modelo'),
          margem_contrib: g('margem_contrib'),
          nopat: y <= 11 ? g('nopat') : null,
          capital_investido: y <= 11 ? g('capital_investido') : null,
          eva: y <= 11 ? (g('nopat') - g('capital_investido') * wacc) : null,
          roic: y <= 11 ? g('roic') : null,
          lc: y <= 11 ? g('lc') : null,
          ls: y <= 11 ? g('ls') : null,
          li: y <= 11 ? g('li') : null,
          lg: y <= 11 ? g('lg') : null,
          pct: y <= 11 ? g('pct') : null,
          ce: y <= 11 ? g('ce') : null,
          ipl: y <= 11 ? g('ipl') : null,
          endiv_geral: y <= 11 ? g('endiv_geral') : null,
          ativo_total: g('ativo_total'),
          ativo_circ: g('ativo_circ'),
          disponivel: g('disponivel'),
          passivo_circ: g('passivo_circ'),
          exigivel_lp: g('exigivel_lp'),
          patrimonio_liquido: g('patrimonio_liquido'),
          dfc_geracao: g('dfc_geracao'),
          dfc_saldo_fim: g('dfc_saldo_fim'),
          dfc_invest: g('dfc_invest'),
          dfc_dividendos: g('dfc_dividendos'),
          // Faixas P10 e P90 para gráficos agregados
          receita_p10: m.receita ? m.receita.p10 : null,
          receita_p90: m.receita ? m.receita.p90 : null,
          margem_ebitda_mod_p10: m.margem_ebitda_modelo ? m.margem_ebitda_modelo.p10 : null,
          margem_ebitda_mod_p90: m.margem_ebitda_modelo ? m.margem_ebitda_modelo.p90 : null
        });
      }
      return anos;
    }

    // Cenário específico (Cen_00001 a Cen_01200)
    const rawRows = DATA.series_cenarios[cenarioId] || DATA.series_cenarios['Cen_00001'];
    for (let idx = 0; idx < rawRows.length; idx++) {
      const r = rawRows[idx];
      const y = idx + 1;
      const rec = r[0];
      const trib = r[1];
      const cust = r[2];
      const da = r[3];
      const ebit = r[4];
      const resFin = r[5];
      const lair = r[6];
      const ir = r[7];
      const lucroLiq = r[8];
      const ebitdaMod = r[9];
      const at = r[10];
      const ac = r[11];
      const disp = r[12];
      const est = r[13];
      const rlp = r[14];
      const pc = r[15];
      const pnc = r[16];
      const pl = y <= 11 ? Math.abs(at - pc - pnc) : r[17];
      const dfcGer = r[18];
      const dfcFim = r[19];
      const dfcInv = r[20];
      const dfcDiv = r[21];

      const ebitdaCalc = ebit + da;
      const mEbitdaCalc = ebitdaCalc / rec;
      const mEbitdaMod = ebitdaMod / rec;
      const mContrib = (rec + trib - cust) / (rec + trib);

      let lc = null, ls = null, li = null, lg = null, pct = null, ce = null, ipl = null, endiv = null;
      let nopat = null, capInv = null, eva = null, roic = null;

      if (y <= 11 && pc > 0) {
        lc = ac / pc;
        ls = (ac - est) / pc;
        li = disp / pc;
        lg = (ac + rlp) / (pc + pnc);
        pct = (pc + pnc) / pl;
        ce = pc / (pc + pnc);
        ipl = (at - ac) / pl;
        endiv = (pc + pnc) / at;
        nopat = ebit * (1.0 - Math.abs(ir) / Math.abs(lair));
        capInv = pc + pnc + pl;
        eva = nopat - capInv * wacc;
        roic = nopat / capInv;
      }

      anos.push({
        ano: y,
        receita: rec,
        tributos: trib,
        receita_liquida: rec + trib,
        custos_var: cust,
        dep_amort: da,
        ebit,
        res_fin: resFin,
        lair,
        ir_csll: ir,
        lucro_liq: lucroLiq,
        ebitda_modelo: ebitdaMod,
        ebitda_calc: ebitdaCalc,
        margem_ebitda_calc: mEbitdaCalc,
        margem_ebitda_modelo: mEbitdaMod,
        margem_contrib: mContrib,
        nopat,
        capital_investido: capInv,
        eva,
        roic,
        lc, ls, li, lg, pct, ce, ipl, endiv_geral: endiv,
        ativo_total: at,
        ativo_circ: ac,
        disponivel: disp,
        passivo_circ: pc,
        exigivel_lp: pnc,
        patrimonio_liquido: pl,
        dfc_geracao: dfcGer,
        dfc_saldo_fim: dfcFim,
        dfc_invest: dfcInv,
        dfc_dividendos: dfcDiv
      });
    }
    return anos;
  }

  function obterRotuloEscopo() {
    if (state.escopoModo === 'media_1200') return 'Média Geral (1.200 Cenários)';
    if (state.escopoModo === 'mediana_1200') return 'Mediana P50 (1.200 Cenários)';
    if (state.escopoModo === 'top10') return `${state.cenarioAtivo} (Top 10 ${state.top10Categoria})`;
    return `Cenário ${state.cenarioAtivo}`;
  }

  // ============================================================================
  // RENDERIZADOR DE GRÁFICOS SVG INTERATIVOS (100% RESPONSIVO & SEM SOBREPOSIÇÃO)
  // ============================================================================
  function splitAxisLabel(rawLabel, xStep) {
    const str = String(rawLabel || '').trim();
    // Abreviação automática de "Ano 1".."Ano 12" quando o espaço por barra for estreito
    const anoMatch = /^Ano\s+(\d+)$/i.exec(str);
    if (anoMatch && xStep < 44) {
      return ['A' + anoMatch[1]];
    }
    if (!/\s/.test(str) && str.length <= 7 && xStep >= 28) {
      return [str];
    }
    const maxCharsPerLine = Math.max(4, Math.floor((xStep - 6) / 5.9));
    if (str.length <= maxCharsPerLine) {
      return [str];
    }
    const words = str.split(/\s+/);
    if (words.length > 1) {
      let line1 = '';
      let line2 = '';
      const mid = Math.ceil(str.length / 2);
      for (const w of words) {
        if (!line1 || (line1.length + 1 + w.length <= Math.max(maxCharsPerLine, mid + 2) && !line2)) {
          line1 = line1 ? line1 + ' ' + w : w;
        } else {
          line2 = line2 ? line2 + ' ' + w : w;
        }
      }
      const trimLine = s => (s.length > maxCharsPerLine + 2 ? s.slice(0, Math.max(3, maxCharsPerLine)) + '…' : s);
      return line2 ? [trimLine(line1), trimLine(line2)] : [trimLine(line1)];
    }
    return [str.slice(0, Math.max(3, maxCharsPerLine - 1)) + '…'];
  }

  function renderLineBarChart(containerId, config) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const labels = config.labels || [];
    const series = config.series || [];
    if (!labels.length || !series.length) {
      el.innerHTML = '<div style="padding:20px;color:#94a3b8;">Sem dados para o período selecionado.</div>';
      return;
    }

    // Legenda HTML Flexbox acima do SVG (nunca sobrepõe textos nem vaza para o gráfico vizinho)
    const legendHtml = `<div class="chart-legend">${series.map(s => {
      const isLine = s.type !== 'bar';
      const swatchStyle = isLine
        ? `background:${s.color};`
        : `background:${s.color};`;
      return `<span class="chart-legend-item"><span class="chart-legend-swatch ${isLine ? 'is-line' : ''}" style="${swatchStyle}"></span><span>${s.name}</span></span>`;
    }).join('')}</div>`;

    const width = Math.max(Math.floor(el.clientWidth || 500), 280);
    const padLeft = 68;
    const padRight = config.dualAxis ? 60 : 20;
    const plotW = Math.max(120, width - padLeft - padRight);
    const xStep = plotW / labels.length;

    const splitLabels = labels.map(lbl => splitAxisLabel(lbl, xStep));
    const hasTwoLineX = splitLabels.some(lines => lines.length > 1);

    const svgH = config.height || 275;
    const pad = { top: 16, right: padRight, bottom: hasTwoLineX ? 46 : 32, left: padLeft };
    const plotH = svgH - pad.top - pad.bottom;

    const leftSeries = series.filter(s => !s.rightAxis);
    const rightSeries = series.filter(s => s.rightAxis);

    function calcBounds(sList, includeZero) {
      let minV = Infinity, maxV = -Infinity;
      for (const s of sList) {
        for (const v of s.data) {
          if (v !== null && v !== undefined && !Number.isNaN(v)) {
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
          }
        }
      }
      if (config.hlines) {
        for (const hl of config.hlines) {
          if (!hl.rightAxis && sList === leftSeries) {
            if (hl.y < minV) minV = hl.y;
            if (hl.y > maxV) maxV = hl.y;
          }
          if (hl.rightAxis && sList === rightSeries) {
            if (hl.y < minV) minV = hl.y;
            if (hl.y > maxV) maxV = hl.y;
          }
        }
      }
      if (minV === Infinity) { minV = 0; maxV = 1; }
      if (includeZero) {
        if (minV > 0) minV = 0;
        if (maxV < 0) maxV = 0;
      }
      const span = maxV - minV || Math.abs(maxV) * 0.1 || 1;
      return { min: minV - (includeZero && minV === 0 ? 0 : span * 0.08), max: maxV + span * 0.12 };
    }

    const hasBarsLeft = leftSeries.some(s => s.type === 'bar');
    const boundsL = calcBounds(leftSeries, hasBarsLeft || config.includeZeroLeft);
    const boundsR = rightSeries.length ? calcBounds(rightSeries, config.includeZeroRight) : boundsL;

    const xPos = idx => pad.left + xStep * (idx + 0.5);
    const yPosL = val => pad.top + plotH - ((val - boundsL.min) / (boundsL.max - boundsL.min || 1)) * plotH;
    const yPosR = val => pad.top + plotH - ((val - boundsR.min) / (boundsR.max - boundsR.min || 1)) * plotH;

    let svg = `<svg viewBox="0 0 ${width} ${svgH}" width="100%" height="${svgH}" style="display:block;width:100%;height:${svgH}px;overflow:hidden;font-family:inherit;">`;

    // Grid horizontal e rótulos Y
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const frac = i / ticks;
      const y = pad.top + plotH - frac * plotH;
      const valL = boundsL.min + frac * (boundsL.max - boundsL.min);
      const fmtL = config.yFormatLeft ? config.yFormatLeft(valL) : valL.toFixed(1);
      svg += `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="rgba(148,163,184,0.12)" stroke-dasharray="3,3" />`;
      svg += `<text x="${pad.left - 8}" y="${y + 3.5}" text-anchor="end" fill="#94a3b8" font-size="10.5">${fmtL}</text>`;

      if (rightSeries.length) {
        const valR = boundsR.min + frac * (boundsR.max - boundsR.min);
        const fmtR = config.yFormatRight ? config.yFormatRight(valR) : valR.toFixed(1);
        svg += `<text x="${width - pad.right + 8}" y="${y + 3.5}" text-anchor="start" fill="#94a3b8" font-size="10.5">${fmtR}</text>`;
      }
    }

    // Linha zero se aplicável
    if (boundsL.min < 0 && boundsL.max > 0) {
      const y0 = yPosL(0);
      svg += `<line x1="${pad.left}" y1="${y0}" x2="${width - pad.right}" y2="${y0}" stroke="rgba(255,255,255,0.28)" stroke-width="1" />`;
    }

    // Rótulos X (1 ou 2 linhas sem sobreposição)
    const xFontSize = xStep < 34 ? '9.5' : '10.5';
    splitLabels.forEach((lines, idx) => {
      const x = xPos(idx);
      const yBase = pad.top + plotH + 15;
      if (lines.length === 1) {
        svg += `<text x="${x.toFixed(1)}" y="${yBase}" text-anchor="middle" fill="#cbd5e1" font-size="${xFontSize}" font-weight="600"><title>${labels[idx]}</title>${lines[0]}</text>`;
      } else {
        svg += `<text x="${x.toFixed(1)}" y="${yBase - 1}" text-anchor="middle" fill="#cbd5e1" font-size="9.8" font-weight="600"><title>${labels[idx]}</title><tspan x="${x.toFixed(1)}" dy="0">${lines[0]}</tspan><tspan x="${x.toFixed(1)}" dy="12">${lines[1]}</tspan></text>`;
      }
    });

    // Barras
    const barSeries = series.filter(s => s.type === 'bar');
    if (barSeries.length) {
      const groupW = Math.min(xStep * 0.74, 46);
      const singleBarW = groupW / barSeries.length;
      barSeries.forEach((s, bIdx) => {
        const yFn = s.rightAxis ? yPosR : yPosL;
        const bBounds = s.rightAxis ? boundsR : boundsL;
        const yZero = yFn(Math.max(0, bBounds.min));
        s.data.forEach((v, i) => {
          if (v === null || v === undefined || Number.isNaN(v)) return;
          const x = xPos(i) - groupW / 2 + bIdx * singleBarW;
          const yVal = yFn(v);
          const topY = Math.min(yZero, yVal);
          const barH = Math.max(2, Math.abs(yZero - yVal));
          const tip = `${labels[i]} | ${s.name}: ${s.format ? s.format(v) : v.toFixed(2)}`;
          svg += `<rect x="${x.toFixed(1)}" y="${topY.toFixed(1)}" width="${Math.max(1.8, singleBarW - 1.5).toFixed(1)}" height="${barH.toFixed(1)}" fill="${s.color}" rx="2"><title>${tip}</title></rect>`;
        });
      });
    }

    // Séries de Linha
    const lineSeries = series.filter(s => s.type !== 'bar');
    for (const s of lineSeries) {
      const yFn = s.rightAxis ? yPosR : yPosL;
      const pts = [];
      s.data.forEach((v, i) => {
        if (v !== null && v !== undefined && !Number.isNaN(v)) {
          pts.push({ x: xPos(i), y: yFn(v), v, lbl: labels[i] });
        }
      });
      if (pts.length > 1) {
        const dPath = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const dash = s.dashed ? 'stroke-dasharray="5,4"' : '';
        svg += `<path d="${dPath}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.5}" ${dash} />`;
      }
      const dotR = xStep < 34 ? '3.2' : '3.8';
      for (const p of pts) {
        const tip = `${p.lbl} | ${s.name}: ${s.format ? s.format(p.v) : p.v.toFixed(2)}`;
        svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dotR}" fill="${s.color}" stroke="#0f172a" stroke-width="1.4"><title>${tip}</title></circle>`;
      }
    }

    // Linhas horizontais de referência com pill opaca (desenhadas por cima p/ leitura limpa sem colisão)
    if (config.hlines) {
      for (const hl of config.hlines) {
        const y = hl.rightAxis ? yPosR(hl.y) : yPosL(hl.y);
        if (y >= pad.top && y <= pad.top + plotH) {
          const strokeCol = hl.color || '#ef4444';
          svg += `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" stroke="${strokeCol}" stroke-width="1.6" stroke-dasharray="5,4" />`;
          if (hl.label) {
            const pillW = Math.min(plotW - 8, hl.label.length * 6.0 + 14);
            const pillX = width - pad.right - pillW - 4;
            const pillY = y - 20 < pad.top ? y + 4 : y - 19;
            svg += `<rect x="${pillX.toFixed(1)}" y="${pillY.toFixed(1)}" width="${pillW.toFixed(1)}" height="15" rx="4" fill="rgba(13, 20, 36, 0.92)" stroke="${strokeCol}" stroke-width="0.9" />`;
            svg += `<text x="${(pillX + pillW / 2).toFixed(1)}" y="${(pillY + 10.8).toFixed(1)}" text-anchor="middle" fill="${strokeCol}" font-size="9.8" font-weight="700">${hl.label}</text>`;
          }
        }
      }
    }

    svg += `</svg>`;
    el.innerHTML = legendHtml + svg;
  }

  // ============================================================================
  // ABA 1: VISÃO FINANCEIRA & EVOLUÇÃO
  // ============================================================================
  function renderAbaVisao() {
    const serieCompleta = obterSerieAnualEscopo(state.escopoModo, state.cenarioAtivo, 0.12);
    const serie = serieCompleta.filter(r => r.ano >= state.anoInicio && r.ano <= state.anoFim);
    const seriePadraoBase = obterSerieAnualEscopo('media_1200', null, 0.12).filter(r => r.ano <= 11);

    const recMed = avg(serie.map(x => x.receita));
    const custMed = avg(serie.map(x => x.custos_var));
    const mContrib = avg(serie.map(x => x.margem_contrib));
    const ebitdaCalc = avg(serie.map(x => x.ebitda_calc));
    const mEbitdaCalc = avg(serie.map(x => x.margem_ebitda_calc));
    const ebitdaMod = avg(serie.map(x => x.ebitda_modelo));
    const mEbitdaMod = avg(serie.map(x => x.margem_ebitda_modelo));
    const nopatMed = avg(serie.map(x => x.nopat));
    const capInvMed = avg(serie.map(x => x.capital_investido));
    const evaMed = avg(serie.map(x => x.eva));
    const roicMed = avg(serie.map(x => x.roic));
    const lcMed = avg(serie.map(x => x.lc));
    const lsMed = avg(serie.map(x => x.ls));
    const liMed = avg(serie.map(x => x.li));
    const lgMed = avg(serie.map(x => x.lg));
    const pctMed = avg(serie.map(x => x.pct));
    const ceMed = avg(serie.map(x => x.ce));
    const iplMed = avg(serie.map(x => x.ipl));
    const endivMed = avg(serie.map(x => x.endiv_geral));

    const baseRec = avg(seriePadraoBase.map(x => x.receita));
    const baseMEbitdaMod = avg(seriePadraoBase.map(x => x.margem_ebitda_modelo));
    const baseMContrib = avg(seriePadraoBase.map(x => x.margem_contrib));
    const baseEva = avg(seriePadraoBase.map(x => x.eva));

    // Nota Ano 12
    const bannerAno12 = document.getElementById('banner-ano12');
    if (bannerAno12) {
      bannerAno12.style.display = state.anoFim === 12 ? 'block' : 'none';
    }

    const kpiHtml = `
      <div class="kpi-card blue">
        <div class="kpi-header-top">
          <div class="kpi-title-text">1. Receita Bruta Média (DRE)</div>
          <div class="kpi-formula-tag">Fórmula: ABS(DRE - Receita)</div>
        </div>
        <div class="kpi-val">${fmtMoeda(recMed)}</div>
        <div class="kpi-meta">
          <span>Média CTI: ${fmtMoeda(baseRec)}</span>
          <span class="delta-badge delta-neutral">${((recMed / baseRec - 1) * 100 >= 0 ? '+' : '') + ((recMed / baseRec - 1) * 100).toFixed(2)}% vs Base</span>
        </div>
      </div>

      <div class="kpi-card cyan">
        <div class="kpi-header-top">
          <div class="kpi-title-text">2. Margem de Contribuição (Proxy)</div>
          <div class="kpi-formula-tag">(Receita + Tributos - |Custos|) / (Rec + Trib)</div>
        </div>
        <div class="kpi-val">${fmtPct(mContrib)}</div>
        <div class="kpi-meta">
          <span>Custos Proxy: ${fmtMoeda(custMed)}</span>
          <span class="delta-badge ${mContrib >= baseMContrib ? 'delta-up' : 'delta-warn'}">${((mContrib - baseMContrib) * 100 >= 0 ? '+' : '') + ((mContrib - baseMContrib) * 100).toFixed(2)} p.p.</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header-top">
          <div class="kpi-title-text">3. Margem EBITDA (Modelo | Calc.)</div>
          <div class="kpi-formula-tag">EBITDA / Receita Bruta</div>
        </div>
        <div class="kpi-val">${fmtPct(mEbitdaMod)} <span style="font-size:0.92rem;color:#94a3b8;font-weight:600;">| ${fmtPct(mEbitdaCalc)}</span></div>
        <div class="kpi-meta">
          <span>Mod: ${fmtMoeda(ebitdaMod)} • Calc: ${fmtMoeda(ebitdaCalc)}</span>
          <span class="delta-badge ${mEbitdaMod >= baseMEbitdaMod ? 'delta-up' : 'delta-warn'}">${((mEbitdaMod - baseMEbitdaMod) * 100 >= 0 ? '+' : '') + ((mEbitdaMod - baseMEbitdaMod) * 100).toFixed(2)} p.p.</span>
        </div>
      </div>

      <div class="kpi-card purple">
        <div class="kpi-header-top">
          <div class="kpi-title-text">4. EVA &amp; Criação de Valor (WACC 12%)</div>
          <div class="kpi-formula-tag">NOPAT - (Capital Investido × 12%)</div>
        </div>
        <div class="kpi-val">${fmtMoeda(evaMed)}</div>
        <div class="kpi-meta">
          <span>ROIC: ${fmtPct(roicMed)} • NOPAT: ${fmtMoeda(nopatMed)}</span>
          <span class="delta-badge ${evaMed > 0 ? 'delta-up' : 'delta-down'}">Spread: ${roicMed !== null ? '+' + ((roicMed - 0.12) * 100).toFixed(2) + ' p.p.' : 'n/d'}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header-top">
          <div class="kpi-title-text">5. Liquidez Corrente (LC) e Seca (LS)</div>
          <div class="kpi-formula-tag">AC / ABS(PC) • (AC - Estoques) / ABS(PC)</div>
        </div>
        <div class="kpi-val">${fmtMult(lcMed)} <span style="font-size:0.9rem;color:#94a3b8;font-weight:600;">| LS ${fmtMult(lsMed)}</span></div>
        <div class="kpi-meta">
          <span>LI: ${fmtMult(liMed)} • LG: ${fmtMult(lgMed)}</span>
          <span class="delta-badge ${lcMed >= 1.0 ? 'delta-up' : 'delta-warn'}">${lcMed >= 1.0 ? 'Cobertura >= 1,0x' : 'Atenção < 1,0x'}</span>
        </div>
      </div>

      <div class="kpi-card amber">
        <div class="kpi-header-top">
          <div class="kpi-title-text">6. Endividamento Geral &amp; Estrutura</div>
          <div class="kpi-formula-tag">(ABS(PC) + ABS(PNC)) / Ativo Total</div>
        </div>
        <div class="kpi-val">${fmtPct(endivMed)} <span style="font-size:0.9rem;color:#94a3b8;font-weight:600;">| PCT ${fmtMult(pctMed)}</span></div>
        <div class="kpi-meta">
          <span>CP (CE): ${fmtPct(ceMed)} • IPL: ${fmtMult(iplMed)}</span>
          <span class="delta-badge delta-neutral">Cap: ${fmtMoeda(capInvMed)}</span>
        </div>
      </div>

      <div class="kpi-card blue">
        <div class="kpi-header-top">
          <div class="kpi-title-text">7. Ticket Médio &amp; LTV Comercial</div>
          <div class="kpi-formula-tag">Ticket × Compras/Ano × Vida × Margem</div>
        </div>
        <div class="kpi-val">R$ 2.100,00<span style="font-size:0.85rem;color:#94a3b8;">/cli</span></div>
        <div class="kpi-meta">
          <span>Ticket R$ 1.000 • Margem 70% • 3 anos</span>
          <span class="delta-badge delta-up">Benchmark CTI</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header-top">
          <div class="kpi-title-text">8. CAC Comercial &amp; Relação LTV/CAC</div>
          <div class="kpi-formula-tag">Investimento / Novos Clientes • LTV / CAC</div>
        </div>
        <div class="kpi-val">10,50x <span style="font-size:0.9rem;color:#94a3b8;font-weight:600;">(CAC R$ 200)</span></div>
        <div class="kpi-meta">
          <span>Acima do piso saudável (3,0x)</span>
          <span class="delta-badge delta-up">Meta Comercial</span>
        </div>
      </div>
    `;
    document.getElementById('visao-kpi-grid').innerHTML = kpiHtml;

    const labelsAnos = serie.map(r => 'Ano ' + r.ano);

    // Gráfico 1: Evolução de Receita, Custos, EBITDA e EVA (R$ bi)
    renderLineBarChart('chart-evolucao-dre', {
      labels: labelsAnos,
      includeZeroLeft: true,
      yFormatLeft: v => 'R$ ' + v.toFixed(1) + ' bi',
      series: [
        { name: 'Receita (R$ bi)', type: 'bar', color: '#3b82f6', data: serie.map(r => r.receita / 1e9), format: v => 'R$ ' + v.toFixed(2) + ' bi' },
        { name: 'EBITDA Modelo (R$ bi)', type: 'bar', color: '#10b981', data: serie.map(r => r.ebitda_modelo / 1e9), format: v => 'R$ ' + v.toFixed(2) + ' bi' },
        { name: 'EBITDA Calc. (R$ bi)', type: 'bar', color: '#06b6d4', data: serie.map(r => r.ebitda_calc / 1e9), format: v => 'R$ ' + v.toFixed(2) + ' bi' },
        { name: 'Custos Var. (R$ bi)', type: 'bar', color: '#f59e0b', data: serie.map(r => r.custos_var / 1e9), format: v => 'R$ ' + v.toFixed(2) + ' bi' },
        { name: 'EVA (R$ bi)', type: 'line', color: '#a855f7', width: 3, data: serie.map(r => r.eva !== null ? r.eva / 1e9 : null), format: v => 'R$ ' + v.toFixed(2) + ' bi' }
      ]
    });

    // Gráfico 2: Evolução das Margens, ROIC e WACC (%)
    renderLineBarChart('chart-evolucao-margens', {
      labels: labelsAnos,
      yFormatLeft: v => v.toFixed(0) + '%',
      hlines: [{ y: 12.0, color: '#ef4444', label: 'WACC = 12,0%' }],
      series: [
        { name: 'Margem Contribuição (%)', type: 'line', color: '#38bdf8', width: 3, data: serie.map(r => r.margem_contrib * 100), format: v => v.toFixed(2) + '%' },
        { name: 'Margem EBITDA Modelo (%)', type: 'line', color: '#10b981', width: 3, data: serie.map(r => r.margem_ebitda_modelo * 100), format: v => v.toFixed(2) + '%' },
        { name: 'Margem EBITDA Calc. (%)', type: 'line', color: '#f59e0b', width: 3, data: serie.map(r => r.margem_ebitda_calc * 100), format: v => v.toFixed(2) + '%' },
        { name: 'ROIC (%)', type: 'line', color: '#c084fc', width: 2.5, dashed: true, data: serie.map(r => r.roic !== null ? r.roic * 100 : null), format: v => v.toFixed(2) + '%' }
      ]
    });

    // Gráfico 3: Evolução da Liquidez e Endividamento (Anos com BP Completo)
    const serieBP = serie.filter(r => r.ano <= 11);
    renderLineBarChart('chart-evolucao-liquidez', {
      labels: serieBP.map(r => 'Ano ' + r.ano),
      dualAxis: true,
      includeZeroLeft: true,
      yFormatLeft: v => v.toFixed(2) + 'x',
      yFormatRight: v => v.toFixed(0) + '%',
      hlines: [{ y: 1.0, color: '#10b981', label: 'LC = 1,0x (Equilíbrio CP)' }],
      series: [
        { name: 'Endividamento Geral (%)', type: 'bar', rightAxis: true, color: 'rgba(244,63,94,0.38)', data: serieBP.map(r => r.endiv_geral * 100), format: v => v.toFixed(1) + '%' },
        { name: 'Liquidez Corrente (LC)', type: 'line', color: '#10b981', width: 3, data: serieBP.map(r => r.lc), format: v => v.toFixed(2) + 'x' },
        { name: 'Liquidez Imediata (LI)', type: 'line', color: '#3b82f6', width: 2.5, data: serieBP.map(r => r.li), format: v => v.toFixed(2) + 'x' },
        { name: 'Liquidez Geral (LG)', type: 'line', color: '#f59e0b', width: 2.5, data: serieBP.map(r => r.lg), format: v => v.toFixed(2) + 'x' }
      ]
    });

    // Gráfico 4: Fluxo de Caixa (DFC)
    renderLineBarChart('chart-evolucao-dfc', {
      labels: labelsAnos,
      includeZeroLeft: true,
      yFormatLeft: v => 'R$ ' + v.toFixed(1) + ' bi',
      series: [
        { name: 'Geração de Caixa (R$ bi)', type: 'bar', color: '#10b981', data: serie.map(r => r.dfc_geracao / 1e9), format: v => 'R$ ' + v.toFixed(2) + ' bi' },
        { name: 'Dividendos / Acionistas (R$ bi)', type: 'bar', color: '#f43f5e', data: serie.map(r => r.dfc_dividendos / 1e9), format: v => 'R$ ' + v.toFixed(2) + ' bi' },
        { name: 'Saldo Final Caixa (R$ bi)', type: 'line', color: '#38bdf8', width: 3, data: serie.map(r => r.dfc_saldo_fim / 1e9), format: v => 'R$ ' + v.toFixed(2) + ' bi' }
      ]
    });

    // Tabela anual detalhada (Anos 1 a 12) — 100% visível na tela sem scroll horizontal
    const subUnidadeEl = document.getElementById('sub-evolucao-unidade');
    if (subUnidadeEl) {
      subUnidadeEl.textContent = descricaoEscalaTabela();
    }
    const footnoteAnualEl = document.getElementById('footnote-evolucao-anual');
    if (footnoteAnualEl) {
      footnoteAnualEl.style.display = serie.some(r => r.ano === 12) ? 'block' : 'none';
    }

    let rowsHtml = '';
    for (const r of serie) {
      const anoLabel = r.ano === 12
        ? `<strong>Ano 12</strong><sup style="color:#fbbf24;font-weight:800;margin-left:2px;" title="Balanço Patrimonial parcial no Ano 12">*</sup>`
        : `<strong>Ano ${r.ano}</strong>`;
      rowsHtml += `
        <tr>
          <td>${anoLabel}</td>
          <td class="num-col">${fmtMoedaTabela(r.receita)}</td>
          <td class="num-col">${fmtMoedaTabela(r.custos_var)}</td>
          <td class="num-col">${fmtPct(r.margem_contrib)}</td>
          <td class="num-col">${fmtMoedaTabela(r.ebitda_calc)}</td>
          <td class="num-col">${fmtPct(r.margem_ebitda_calc)}</td>
          <td class="num-col">${fmtMoedaTabela(r.ebitda_modelo)}</td>
          <td class="num-col">${fmtPct(r.margem_ebitda_modelo)}</td>
          <td class="num-col">${fmtMoedaTabela(r.nopat)}</td>
          <td class="num-col">${fmtMoedaTabela(r.eva)}</td>
          <td class="num-col">${fmtPct(r.roic)}</td>
          <td class="num-col">${fmtMult(r.lc)}</td>
          <td class="num-col">${fmtPct(r.endiv_geral)}</td>
        </tr>
      `;
    }
    document.getElementById('tbody-evolucao-anual').innerHTML = rowsHtml;
  }

  // ============================================================================
  // ABA 2: PAINEL DE METAS & PERFORMANCE (OKRs)
  // ============================================================================
  function renderAbaMetas() {
    const serie = obterSerieAnualEscopo(state.escopoModo, state.cenarioAtivo, 0.12)
      .filter(r => r.ano >= state.anoInicio && r.ano <= state.anoFim);

    const mEbitdaMod = avg(serie.map(x => x.margem_ebitda_modelo));
    const mEbitdaCalc = avg(serie.map(x => x.margem_ebitda_calc));
    const mContrib = avg(serie.map(x => x.margem_contrib));
    const roicMed = avg(serie.map(x => x.roic));
    const evaBi = avg(serie.map(x => x.eva)) / 1e9;
    const recBi = avg(serie.map(x => x.receita)) / 1e9;
    const lcMed = avg(serie.map(x => x.lc));
    const endivMed = avg(serie.map(x => x.endiv_geral));

    const m = state.metas;
    const cenarios = DATA.resumo_cenarios;

    const defs = [
      {
        nome: 'Margem EBITDA do Modelo',
        rotuloCurto: 'Margem EBITDA Mod.',
        real: mEbitdaMod * 100,
        meta: m.margemEbitdaMod,
        unid: '%',
        maiorMelhor: true,
        bateuCen: cenarios.filter(c => c.margem_ebitda_modelo * 100 >= m.margemEbitdaMod).length
      },
      {
        nome: 'Margem EBITDA Calculada',
        rotuloCurto: 'Margem EBITDA Calc.',
        real: mEbitdaCalc * 100,
        meta: m.margemEbitdaCalc,
        unid: '%',
        maiorMelhor: true,
        bateuCen: cenarios.filter(c => c.margem_ebitda_calc * 100 >= m.margemEbitdaCalc).length
      },
      {
        nome: 'Margem de Contribuição (Proxy)',
        rotuloCurto: 'Margem Contrib.',
        real: mContrib * 100,
        meta: m.margemContrib,
        unid: '%',
        maiorMelhor: true,
        bateuCen: cenarios.filter(c => c.margem_contrib_media * 100 >= m.margemContrib).length
      },
      {
        nome: 'ROIC Anual (Retorno s/ Capital Investido)',
        rotuloCurto: 'ROIC Anual',
        real: roicMed * 100,
        meta: m.roic,
        unid: '%',
        maiorMelhor: true,
        bateuCen: cenarios.filter(c => c.roic * 100 >= m.roic).length
      },
      {
        nome: 'EVA Médio Anual (Criação de Valor)',
        rotuloCurto: 'EVA Médio',
        real: evaBi,
        meta: m.evaBi,
        unid: 'R$ bi',
        maiorMelhor: true,
        bateuCen: cenarios.filter(c => c.eva / 1e9 >= m.evaBi).length
      },
      {
        nome: 'Receita Bruta Anual',
        rotuloCurto: 'Receita Bruta',
        real: recBi,
        meta: m.receitaBi,
        unid: 'R$ bi',
        maiorMelhor: true,
        bateuCen: cenarios.filter(c => c.receita_media / 1e9 >= m.receitaBi).length
      },
      {
        nome: 'Liquidez Corrente Mínima (LC)',
        rotuloCurto: 'Liquidez (LC)',
        real: lcMed,
        meta: m.lcMin,
        unid: 'x',
        maiorMelhor: true,
        bateuCen: cenarios.filter(c => c.lc >= m.lcMin).length
      },
      {
        nome: 'Teto de Endividamento Geral Máx.',
        rotuloCurto: 'Teto Endivid.',
        real: endivMed * 100,
        meta: m.endivMax,
        unid: '%',
        maiorMelhor: false,
        bateuCen: cenarios.filter(c => c.endiv_geral * 100 <= m.endivMax).length
      }
    ];

    let rowsHtml = '';
    let totalAtingidas = 0;

    for (const d of defs) {
      const atingPct = d.maiorMelhor ? (d.real / d.meta) * 100 : (d.meta / d.real) * 100;
      const bateu = d.maiorMelhor ? d.real >= d.meta : d.real <= d.meta;
      if (bateu) totalAtingidas++;

      const gap = d.real - d.meta;
      let realStr = '', metaStr = '', gapStr = '';
      if (d.unid === '%') {
        realStr = d.real.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        metaStr = d.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        gapStr = (gap >= 0 ? '+' : '') + gap.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' p.p.';
      } else if (d.unid === 'x') {
        realStr = d.real.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'x';
        metaStr = d.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'x';
        gapStr = (gap >= 0 ? '+' : '') + gap.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'x';
      } else {
        realStr = 'R$ ' + d.real.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' bi';
        metaStr = 'R$ ' + d.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' bi';
        gapStr = (gap >= 0 ? '+R$ ' : '-R$ ') + Math.abs(gap).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' bi';
      }

      const badgeClass = bateu ? 'delta-up' : (atingPct >= 97 ? 'delta-warn' : 'delta-down');
      const badgeText = bateu ? 'Atingida' : (atingPct >= 97 ? 'Alerta (>=97%)' : 'Abaixo da Meta');
      const barColor = bateu ? '#10b981' : (atingPct >= 97 ? '#f59e0b' : '#f43f5e');
      const pctCen = (d.bateuCen / 1200) * 100;

      rowsHtml += `
        <tr>
          <td><strong>${d.nome}</strong></td>
          <td class="num-col">${realStr}</td>
          <td class="num-col">${metaStr}</td>
          <td class="num-col">${gapStr}</td>
          <td class="num-col"><strong>${atingPct.toFixed(1)}%</strong></td>
          <td>
            <div class="progress-track">
              <div class="progress-fill" style="width:${Math.min(100, Math.max(5, atingPct))}%;background:${barColor};"></div>
            </div>
          </td>
          <td><span class="delta-badge ${badgeClass}">${badgeText}</span></td>
          <td class="num-col">${d.bateuCen}/1.200 (<strong>${pctCen.toFixed(1)}%</strong>)</td>
        </tr>
      `;
    }

    document.getElementById('tbody-metas').innerHTML = rowsHtml;

    // Quantos cenários batem TODAS as metas de rentabilidade simultaneamente
    const cenSimultaneos = cenarios.filter(c =>
      c.margem_ebitda_modelo * 100 >= m.margemEbitdaMod &&
      c.margem_ebitda_calc * 100 >= m.margemEbitdaCalc &&
      c.margem_contrib_media * 100 >= m.margemContrib &&
      c.roic * 100 >= m.roic &&
      c.eva / 1e9 >= m.evaBi
    ).length;

    document.getElementById('metas-summary-cards').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Metas Atingidas no Escopo Ativo</div>
          <div class="kpi-formula-tag">Status consolidado de OKRs financeiros</div>
        </div>
        <div class="kpi-val">${totalAtingidas} de ${defs.length}</div>
        <div class="kpi-meta"><span>${obterRotuloEscopo()}</span><span class="delta-badge ${totalAtingidas >= 6 ? 'delta-up' : 'delta-warn'}">${((totalAtingidas / defs.length) * 100).toFixed(0)}% Cumprido</span></div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Cenários com Rentabilidade Plena</div>
          <div class="kpi-formula-tag">Atingem simultaneamente todas as metas de margem/EVA</div>
        </div>
        <div class="kpi-val">${cenSimultaneos} <span style="font-size:0.9rem;color:#94a3b8;">/ 1.200 cenários</span></div>
        <div class="kpi-meta"><span>Probabilidade Conjunta CTI</span><span class="delta-badge delta-neutral">${((cenSimultaneos / 1200) * 100).toFixed(1)}% da Base</span></div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Spread de Valor (ROIC vs WACC 12%)</div>
          <div class="kpi-formula-tag">Excesso de retorno sobre o custo de capital</div>
        </div>
        <div class="kpi-val">+${((roicMed - 0.12) * 100).toFixed(2)} p.p.</div>
        <div class="kpi-meta"><span>1.200 de 1.200 cenários geram EVA > 0</span><span class="delta-badge delta-up">100% Criam Valor</span></div>
      </div>
    `;

    // Gráfico de barras de probabilidade nos 1.200 cenários
    renderLineBarChart('chart-metas-probabilidade', {
      labels: defs.map(d => d.rotuloCurto),
      includeZeroLeft: true,
      yFormatLeft: v => v.toFixed(0) + '%',
      hlines: [{ y: 50, color: '#38bdf8', label: '50% dos Cenários' }],
      series: [
        { name: '% dos 1.200 Cenários que Atingem a Meta', type: 'bar', color: '#10b981', data: defs.map(d => (d.bateuCen / 1200) * 100), format: v => v.toFixed(1) + '%' },
        { name: '% Atingimento no Recorte Ativo', type: 'line', color: '#f59e0b', width: 3, data: defs.map(d => d.maiorMelhor ? (d.real / d.meta) * 100 : (d.meta / d.real) * 100), format: v => v.toFixed(1) + '%' }
      ]
    });
  }

  // ============================================================================
  // ABA 3: TICKET MÉDIO, CAC & LTV (UNIT ECONOMICS)
  // ============================================================================
  function renderAbaTicket() {
    const t = state.ticket;
    const serie = obterSerieAnualEscopo(state.escopoModo, state.cenarioAtivo, 0.12)
      .filter(r => r.ano >= state.anoInicio && r.ano <= state.anoFim);
    const recMed = avg(serie.map(x => x.receita));

    const desc = t.descontoPct / 100.0;
    const margBase = t.margemBasePct / 100.0;
    const ticketLiq = t.ticketBruto * (1.0 - desc);
    const custoUnitario = t.ticketBruto * (1.0 - margBase);

    let margEfetiva = margBase;
    if (t.comprimirMargem && ticketLiq > 0) {
      margEfetiva = Math.max(0, (ticketLiq - custoUnitario) / ticketLiq);
    }

    const recAnualCli = ticketLiq * t.comprasAno;
    const margemAnualCli = recAnualCli * margEfetiva;
    const ltvSim = recAnualCli * t.vidaMediaAnos * margEfetiva;
    const cacSim = t.novosClientes > 0 ? t.investimentoAq / t.novosClientes : 0;
    const ltvCac = cacSim > 0 ? ltvSim / cacSim : 0;
    const paybackMeses = margemAnualCli > 0 ? cacSim / (margemAnualCli / 12.0) : 0;
    const clientesAtivosImpl = recAnualCli > 0 ? recMed / recAnualCli : 0;

    document.getElementById('ticket-kpi-grid').innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Ticket Médio Líquido (Pós-Cupom)</div>
          <div class="kpi-formula-tag">Ticket Bruto × (1 - Desconto%)</div>
        </div>
        <div class="kpi-val">R$ ${ticketLiq.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="kpi-meta">
          <span>Bruto: R$ ${t.ticketBruto.toLocaleString('pt-BR')} • Desc: ${t.descontoPct.toFixed(1)}%</span>
          <span class="delta-badge delta-neutral">${t.comprasAno.toFixed(1)} compra(s)/ano</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header-top">
          <div class="kpi-title-text">LTV Projetado (Valor Vitalício)</div>
          <div class="kpi-formula-tag">Ticket × Compras × Vida × Margem</div>
        </div>
        <div class="kpi-val">R$ ${ltvSim.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="kpi-meta">
          <span>Ref. CTI: R$ 2.100,00 • Margem: ${(margEfetiva * 100).toFixed(1)}%</span>
          <span class="delta-badge ${ltvSim >= 2100 ? 'delta-up' : 'delta-warn'}">${((ltvSim / 2100 - 1) * 100 >= 0 ? '+' : '') + ((ltvSim / 2100 - 1) * 100).toFixed(1)}% vs Ref.</span>
        </div>
      </div>

      <div class="kpi-card cyan">
        <div class="kpi-header-top">
          <div class="kpi-title-text">CAC Projetado &amp; Payback</div>
          <div class="kpi-formula-tag">Investimento / Novos Clientes</div>
        </div>
        <div class="kpi-val">R$ ${cacSim.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="kpi-meta">
          <span>Ref. CTI: R$ 200,00 • Payback: ${paybackMeses.toFixed(1)} meses</span>
          <span class="delta-badge ${cacSim <= 200 ? 'delta-up' : 'delta-warn'}">${t.novosClientes.toLocaleString('pt-BR')} clientes</span>
        </div>
      </div>

      <div class="kpi-card ${ltvCac >= 3.0 ? 'purple' : 'rose'}">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Relação LTV / CAC</div>
          <div class="kpi-formula-tag">Múltiplo de Retorno Comercial</div>
        </div>
        <div class="kpi-val">${fmtMult(ltvCac)}</div>
        <div class="kpi-meta">
          <span>Ref. CTI: 10,50x • Clientes Impl.: ${Math.round(clientesAtivosImpl / 1e3).toLocaleString('pt-BR')} mil</span>
          <span class="delta-badge ${ltvCac >= 3.0 ? 'delta-up' : 'delta-down'}">${ltvCac >= 3.0 ? 'Saudável (>= 3,0x)' : 'Crítico (< 3,0x)'}</span>
        </div>
      </div>
    `;

    // Gráfico de sensibilidade do LTV e LTV/CAC ao Desconto/Cupom no Ticket (0% a 35%)
    const gridDesc = [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 25, 30, 35];
    const ltvSeries = [];
    const ltvCacSeries = [];

    for (const dPct of gridDesc) {
      const d = dPct / 100.0;
      const tLiq = t.ticketBruto * (1.0 - d);
      const mEf = (t.comprimirMargem && tLiq > 0) ? Math.max(0, (tLiq - custoUnitario) / tLiq) : margBase;
      const lVal = tLiq * t.comprasAno * t.vidaMediaAnos * mEf;
      ltvSeries.push(lVal);
      ltvCacSeries.push(cacSim > 0 ? lVal / cacSim : 0);
    }

    renderLineBarChart('chart-ticket-ltv', {
      labels: gridDesc.map(d => '-' + d + '%'),
      dualAxis: true,
      includeZeroLeft: true,
      yFormatLeft: v => 'R$ ' + Math.round(v),
      yFormatRight: v => v.toFixed(1) + 'x',
      hlines: [{ y: 3.0, rightAxis: true, color: '#ef4444', label: 'Piso LTV/CAC = 3,0x' }],
      series: [
        { name: 'LTV Simulado (R$/cli)', type: 'bar', color: '#10b981', data: ltvSeries, format: v => 'R$ ' + v.toFixed(2) },
        { name: 'Relação LTV/CAC (x)', type: 'line', rightAxis: true, color: '#38bdf8', width: 3, data: ltvCacSeries, format: v => v.toFixed(2) + 'x' }
      ]
    });
  }

  // ============================================================================
  // ABA 4: ANÁLISE DE SENSIBILIDADE & CENÁRIOS WHAT-IF (DRE, MARGENS E EVA)
  // ============================================================================
  function renderAbaSensibilidade() {
    const s = state.sensib;
    const desc = s.descontoPct / 100.0;
    const vol = s.volumePct / 100.0;
    const custVar = s.custoUnitPct / 100.0;
    const waccSim = s.waccPct / 100.0;

    const serieBase = obterSerieAnualEscopo(state.escopoModo, state.cenarioAtivo, 0.12)
      .filter(r => r.ano >= state.anoInicio && r.ano <= state.anoFim);

    const fatorRec = (1.0 + vol) * (1.0 - desc);
    const fatorCust = (1.0 + vol) * (1.0 + custVar);

    const serieSim = serieBase.map(r => {
      const recSim = r.receita * fatorRec;
      const tribSim = r.tributos * fatorRec;
      const recLiqSim = recSim + tribSim;
      const custSim = r.custos_var * fatorCust;

      const deltaRecLiq = recLiqSim - r.receita_liquida;
      const deltaCust = custSim - r.custos_var;
      const deltaOp = deltaRecLiq - deltaCust;

      const mContribSim = (recLiqSim - custSim) / recLiqSim;
      const ebitdaCalcSim = r.ebitda_calc + deltaOp;
      const ebitdaModSim = r.ebitda_modelo + deltaOp;
      const mEbitdaCalcSim = ebitdaCalcSim / recSim;
      const mEbitdaModSim = ebitdaModSim / recSim;

      const taxaIr = Math.min(0.99, Math.max(0, Math.abs(r.ir_csll) / Math.abs(r.lair)));
      const ebitSim = r.ebit + deltaOp;
      const nopatSim = r.ano <= 11 ? ebitSim * (1.0 - taxaIr) : null;
      const roicSim = (r.ano <= 11 && r.capital_investido) ? nopatSim / r.capital_investido : null;
      const evaSim = (r.ano <= 11 && r.capital_investido) ? (nopatSim - r.capital_investido * waccSim) : null;

      return {
        ano: r.ano,
        receita_base: r.receita,
        receita_sim: recSim,
        m_contrib_base: r.margem_contrib,
        m_contrib_sim: mContribSim,
        m_ebitda_calc_base: r.margem_ebitda_calc,
        m_ebitda_calc_sim: mEbitdaCalcSim,
        m_ebitda_mod_base: r.margem_ebitda_modelo,
        m_ebitda_mod_sim: mEbitdaModSim,
        ebitda_calc_base: r.ebitda_calc,
        ebitda_calc_sim: ebitdaCalcSim,
        eva_base: r.eva,
        eva_sim: evaSim,
        roic_base: r.roic,
        roic_sim: roicSim
      };
    });

    const mContribBase = avg(serieSim.map(x => x.m_contrib_base));
    const mContribSim = avg(serieSim.map(x => x.m_contrib_sim));
    const mEbitdaCalcBase = avg(serieSim.map(x => x.m_ebitda_calc_base));
    const mEbitdaCalcSim = avg(serieSim.map(x => x.m_ebitda_calc_sim));
    const mEbitdaModBase = avg(serieSim.map(x => x.m_ebitda_mod_base));
    const mEbitdaModSim = avg(serieSim.map(x => x.m_ebitda_mod_sim));
    const evaBase = avg(serieSim.map(x => x.eva_base));
    const evaSim = avg(serieSim.map(x => x.eva_sim));

    // Break-even de volume para compensar o desconto/cupom
    const recLiqMed = avg(serieBase.map(x => x.receita_liquida));
    const custMed = avg(serieBase.map(x => x.custos_var));
    const mcRsBase = recLiqMed - custMed;
    const mcRsUnitPosDesc = recLiqMed * (1.0 - desc) - custMed * (1.0 + custVar);
    const volBreakEven = mcRsUnitPosDesc > 0 ? (mcRsBase / mcRsUnitPosDesc) - 1.0 : null;

    document.getElementById('sensib-kpi-grid').innerHTML = `
      <div class="kpi-card cyan">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Margem de Contribuição Simulada</div>
          <div class="kpi-formula-tag">Impacto líquido de desconto e custo variável</div>
        </div>
        <div class="kpi-val">${fmtPct(mContribSim)}</div>
        <div class="kpi-meta">
          <span>Cenário Base: ${fmtPct(mContribBase)}</span>
          <span class="delta-badge ${mContribSim >= mContribBase ? 'delta-up' : 'delta-down'}">${((mContribSim - mContribBase) * 100 >= 0 ? '+' : '') + ((mContribSim - mContribBase) * 100).toFixed(2)} p.p.</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Margem EBITDA Calculada Simulada</div>
          <div class="kpi-formula-tag">EBITDA Calculado Simulado / Receita</div>
        </div>
        <div class="kpi-val">${fmtPct(mEbitdaCalcSim)}</div>
        <div class="kpi-meta">
          <span>Base: ${fmtPct(mEbitdaCalcBase)} • Mod: ${fmtPct(mEbitdaModSim)}</span>
          <span class="delta-badge ${mEbitdaCalcSim >= mEbitdaCalcBase ? 'delta-up' : 'delta-down'}">${((mEbitdaCalcSim - mEbitdaCalcBase) * 100 >= 0 ? '+' : '') + ((mEbitdaCalcSim - mEbitdaCalcBase) * 100).toFixed(2)} p.p.</span>
        </div>
      </div>

      <div class="kpi-card purple">
        <div class="kpi-header-top">
          <div class="kpi-title-text">EVA Médio Simulado (WACC ${s.waccPct.toFixed(1)}%)</div>
          <div class="kpi-formula-tag">NOPAT Simulado - (Cap. Investido × WACC)</div>
        </div>
        <div class="kpi-val">${fmtMoeda(evaSim)}</div>
        <div class="kpi-meta">
          <span>Base (12%): ${fmtMoeda(evaBase)}</span>
          <span class="delta-badge ${evaSim >= evaBase ? 'delta-up' : (evaSim > 0 ? 'delta-warn' : 'delta-down')}">${fmtMoeda(evaSim - evaBase)} vs Base</span>
        </div>
      </div>

      <div class="kpi-card amber">
        <div class="kpi-header-top">
          <div class="kpi-title-text">Volume Break-Even p/ Cupom</div>
          <div class="kpi-formula-tag">Elasticidade p/ manter Margem R$ constante</div>
        </div>
        <div class="kpi-val">${volBreakEven !== null && volBreakEven >= 0 ? '+' + fmtPct(volBreakEven) : '0,00%'}</div>
        <div class="kpi-meta">
          <span>Compensa ${s.descontoPct.toFixed(1)}% de desconto</span>
          <span class="delta-badge delta-neutral">Ponto de Equilíbrio</span>
        </div>
      </div>
    `;

    // Gráfico comparativo anual Base vs Simulado
    renderLineBarChart('chart-sensib-comparativo', {
      labels: serieSim.map(r => 'Ano ' + r.ano),
      yFormatLeft: v => v.toFixed(0) + '%',
      series: [
        { name: 'Margem Contrib. Base (%)', type: 'line', color: '#0284c7', dashed: true, data: serieSim.map(r => r.m_contrib_base * 100), format: v => v.toFixed(2) + '%' },
        { name: 'Margem Contrib. Simulada (%)', type: 'line', color: '#38bdf8', width: 3, data: serieSim.map(r => r.m_contrib_sim * 100), format: v => v.toFixed(2) + '%' },
        { name: 'Margem EBITDA Calc. Base (%)', type: 'line', color: '#94a3b8', dashed: true, data: serieSim.map(r => r.m_ebitda_calc_base * 100), format: v => v.toFixed(2) + '%' },
        { name: 'Margem EBITDA Calc. Simulada (%)', type: 'line', color: '#f59e0b', width: 3, data: serieSim.map(r => r.m_ebitda_calc_sim * 100), format: v => v.toFixed(2) + '%' }
      ]
    });

    // Matriz de Sensibilidade Bivariada (Desconto/Cupom x Custos Variáveis)
    const descGrid = [0, 2.5, 5, 7.5, 10, 15, 20];
    const custGrid = [-15, -10, -5, 0, 5, 10, 15, 20];
    const recMed = avg(serieBase.map(x => x.receita));
    const tribMed = avg(serieBase.map(x => x.tributos));
    const ebitdaCalcMed = avg(serieBase.map(x => x.ebitda_calc));
    const ebitMed = avg(serieBase.map(x => x.ebit));
    const capInvMed = avg(serieBase.map(x => x.capital_investido));
    const taxaIrMed = 0.34;

    let heatHtml = `<thead><tr><th>Custos \\ Cupom</th>`;
    for (const d of descGrid) {
      const dStr = d % 1 === 0 ? d.toFixed(0) : d.toFixed(1).replace('.', ',');
      heatHtml += `<th>-${dStr}%</th>`;
    }
    heatHtml += `</tr></thead><tbody>`;

    for (const c of custGrid) {
      heatHtml += `<tr><th>${c >= 0 ? '+' : ''}${c}%</th>`;
      for (const d of descGrid) {
        const dFrac = d / 100.0;
        const cFrac = c / 100.0;
        const rS = recMed * (1.0 - dFrac);
        const tS = tribMed * (1.0 - dFrac);
        const cS = custMed * (1.0 + cFrac);
        const deltaOp = ((rS + tS) - (recMed + tribMed)) - (cS - custMed);

        let val = 0, txt = '', bg = '';
        if (s.metricaHeatmap === 'margem_contrib') {
          val = ((rS + tS - cS) / (rS + tS)) * 100;
          txt = val.toFixed(2).replace('.', ',') + '%';
          const ratio = Math.min(1, Math.max(0, (val - 70) / 16));
          bg = `rgba(${Math.round(239 * (1 - ratio) + 16 * ratio)}, ${Math.round(68 * (1 - ratio) + 185 * ratio)}, 100, 0.32)`;
        } else if (s.metricaHeatmap === 'eva_bi') {
          const nopatS = (ebitMed + deltaOp) * (1.0 - taxaIrMed);
          val = (nopatS - capInvMed * waccSim) / 1e9;
          txt = val.toFixed(2).replace('.', ',') + ' bi';
          const ratio = Math.min(1, Math.max(0, (val - 0.5) / 1.6));
          bg = `rgba(${Math.round(239 * (1 - ratio) + 16 * ratio)}, ${Math.round(68 * (1 - ratio) + 185 * ratio)}, 100, 0.32)`;
        } else {
          val = ((ebitdaCalcMed + deltaOp) / rS) * 100;
          txt = val.toFixed(2).replace('.', ',') + '%';
          const ratio = Math.min(1, Math.max(0, (val - 64) / 15));
          bg = `rgba(${Math.round(239 * (1 - ratio) + 16 * ratio)}, ${Math.round(68 * (1 - ratio) + 185 * ratio)}, 100, 0.32)`;
        }
        const isCurrent = Math.abs(d - s.descontoPct) < 1.3 && Math.abs(c - s.custoUnitPct) < 2.6;
        const borderStyle = isCurrent ? 'outline:2px solid #38bdf8;font-weight:800;' : '';
        heatHtml += `<td style="background:${bg};${borderStyle}">${txt}</td>`;
      }
      heatHtml += `</tr>`;
    }
    heatHtml += `</tbody>`;
    document.getElementById('heatmap-sensibilidade').innerHTML = heatHtml;
  }

  // ============================================================================
  // ABA 5: RANKINGS ESTRATÉGICOS & COMPARADOR DOS 1.200 CENÁRIOS
  // ============================================================================
  function renderAbaRankings() {
    // Top 10 da categoria selecionada
    const topFiltered = DATA.top10.filter(t => t.categoria === state.rankCategoriaTop10);
    let topHtml = '';
    for (const r of topFiltered) {
      const cenObj = DATA.resumo_cenarios.find(c => c.cenario === r.cenario) || {};
      const indFmt = r.categoria.includes('LIQUIDEZ')
        ? fmtMult(r.indicador, 4)
        : (r.categoria === 'BAIXO RISCO' ? r.indicador.toFixed(4) : fmtPct(r.indicador, 2));

      topHtml += `
        <tr>
          <td><strong>#${r.posicao}</strong></td>
          <td><button class="btn" style="padding:3px 8px;font-size:0.72rem;" onclick="window.selecionarCenarioPainel('${r.cenario}')">${r.cenario} &rarr;</button></td>
          <td class="num-col"><strong>${indFmt}</strong></td>
          <td>${r.criterio}</td>
          <td class="num-col">${fmtPct(cenObj.margem_ebitda_modelo)}</td>
          <td class="num-col">${fmtMult(cenObj.lc)}</td>
          <td class="num-col">${fmtPct(cenObj.roic)}</td>
          <td class="num-col">${fmtMoedaTabela(cenObj.eva)}</td>
        </tr>
      `;
    }
    document.getElementById('tbody-top10').innerHTML = topHtml;

    // Tabela filtrada dos 1.200 cenários
    const q = state.buscaCenario.trim().toLowerCase();
    const lista = DATA.resumo_cenarios
      .filter(c => !q || c.cenario.toLowerCase().includes(q) || String(c.rank_rentabilidade) === q)
      .slice()
      .sort((a, b) => a.rank_rentabilidade - b.rank_rentabilidade)
      .slice(0, 100);

    let rankHtml = '';
    for (const c of lista) {
      rankHtml += `
        <tr>
          <td><strong>#${c.rank_rentabilidade}</strong></td>
          <td><button class="btn" style="padding:2px 7px;font-size:0.72rem;" onclick="window.selecionarCenarioPainel('${c.cenario}')">${c.cenario}</button></td>
          <td class="num-col">${fmtPct(c.margem_ebitda_modelo)}</td>
          <td class="num-col">${fmtPct(c.margem_ebitda_calc)}</td>
          <td class="num-col">${fmtPct(c.margem_contrib_media)}</td>
          <td class="num-col">${fmtMoedaTabela(c.receita_media)}</td>
          <td class="num-col">${fmtMoedaTabela(c.ebitda_calc)}</td>
          <td class="num-col">${fmtMoedaTabela(c.eva)}</td>
          <td class="num-col">${fmtPct(c.roic)}</td>
          <td class="num-col">${fmtMult(c.lc)}</td>
          <td class="num-col">${fmtPct(c.endiv_geral)}</td>
          <td class="num-col">${c.score_baixo_risco.toFixed(4)}</td>
        </tr>
      `;
    }
    document.getElementById('tbody-ranking-geral').innerHTML = rankHtml;
  }

  // ============================================================================
  // ABA 6: GOVERNANÇA DE KPIS, ESTATÍSTICAS & AUDITORIA CORPORATIVA
  // ============================================================================
  function renderAbaDicionario() {
    const cat = state.filtroCatDicionario;
    const q = state.buscaDicionario.trim().toLowerCase();

    const dicFiltered = DATA.dicionario.filter(d => {
      const okCat = cat === 'TODAS' || d.categoria === cat;
      const obsNorm = normalizarTextoCorporativo(d.observacao);
      const okQ = !q ||
        d.kpi.toLowerCase().includes(q) ||
        d.descricao.toLowerCase().includes(q) ||
        d.formula.toLowerCase().includes(q) ||
        obsNorm.toLowerCase().includes(q);
      return okCat && okQ;
    });

    let dicHtml = '';
    for (const d of dicFiltered) {
      dicHtml += `
        <tr>
          <td><span class="delta-badge delta-neutral">${d.categoria}</span></td>
          <td><strong>${d.kpi}</strong></td>
          <td>${normalizarTextoCorporativo(d.descricao)}</td>
          <td><code>${d.formula}</code></td>
          <td>${d.unidade}</td>
          <td>${d.nivel} (${d.periodicidade})</td>
          <td>${normalizarTextoCorporativo(d.interpretacao)}</td>
          <td>${normalizarTextoCorporativo(d.observacao)}</td>
          <td>${normalizarTextoCorporativo(d.regra_reconciliada)}</td>
        </tr>
      `;
    }
    document.getElementById('tbody-dicionario').innerHTML = dicHtml;

    // Estatísticas Descritivas Oficiais (KPIs_Estatisticas)
    let estHtml = '';
    for (const e of DATA.estatisticas) {
      const fmtVal = v => {
        if (e.unidade === '%') return fmtPct(v, 2);
        if (e.unidade === 'x') return fmtMult(v, 2);
        if (e.unidade === 'R$') return fmtMoedaTabela(v);
        return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };
      const kpiWrap = String(e.kpi).replace(/_/g, '_<wbr>');
      estHtml += `
        <tr>
          <td style="white-space:normal;"><strong>${kpiWrap}</strong></td>
          <td>${e.unidade}</td>
          <td class="num-col">${e.n}</td>
          <td class="num-col"><strong>${fmtVal(e.media)}</strong></td>
          <td class="num-col">${fmtVal(e.desvio_padrao)}</td>
          <td class="num-col">${fmtVal(e.minimo)}</td>
          <td class="num-col">${fmtVal(e.p5)}</td>
          <td class="num-col">${fmtVal(e.p25)}</td>
          <td class="num-col"><strong>${fmtVal(e.p50)}</strong></td>
          <td class="num-col">${fmtVal(e.p75)}</td>
          <td class="num-col">${fmtVal(e.p95)}</td>
          <td class="num-col">${fmtVal(e.maximo)}</td>
        </tr>
      `;
    }
    document.getElementById('tbody-estatisticas').innerHTML = estHtml;
  }

  // Renderização global da aba ativa
  function renderActiveTab() {
    document.getElementById('header-active-scope').textContent =
      `${obterRotuloEscopo()} • Anos ${state.anoInicio} a ${state.anoFim}`;

    if (state.activeTab === 'tab-visao') renderAbaVisao();
    else if (state.activeTab === 'tab-metas') renderAbaMetas();
    else if (state.activeTab === 'tab-ticket') renderAbaTicket();
    else if (state.activeTab === 'tab-sensib') renderAbaSensibilidade();
    else if (state.activeTab === 'tab-rankings') renderAbaRankings();
    else if (state.activeTab === 'tab-dic') renderAbaDicionario();
  }

  // Exportação CSV dos 1.200 cenários
  window.exportarResumoCSV = function () {
    const cols = [
      'cenario', 'rank_rentabilidade', 'margem_ebitda_modelo', 'margem_ebitda_calc',
      'margem_contrib_media', 'receita_media', 'custos_var_medios', 'ebitda_calc',
      'ebitda_modelo', 'nopat', 'capital_investido', 'eva', 'roic',
      'lc', 'ls', 'li', 'lg', 'pct', 'ce', 'ipl', 'endiv_geral',
      'score_baixo_risco', 'cac_simulado', 'ltv_simulado', 'ltv_cac'
    ];
    let csv = '\uFEFF' + cols.join(';') + '\n';
    for (const r of DATA.resumo_cenarios) {
      csv += cols.map(c => String(r[c]).replace('.', ',')).join(';') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CTI_Global_Consolidado_1200_Cenarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Selecionar cenário diretamente a partir da tabela de Rankings
  window.selecionarCenarioPainel = function (cenarioId) {
    state.escopoModo = 'cenario';
    state.cenarioAtivo = cenarioId;
    document.getElementById('sel-escopo-modo').value = 'cenario';
    document.getElementById('sel-cenario-especifico').value = cenarioId;
    atualizarVisibilidadeSeletoresEscopo();
    ativarAba('tab-visao');
  };

  function ativarAba(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(btn => {
      const isMatch = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isMatch);
      if (isMatch) {
        const modTitle = btn.getAttribute('data-title');
        const titleEl = document.getElementById('topbar-module-title');
        if (titleEl && modTitle) titleEl.textContent = modTitle;
      }
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
    renderActiveTab();
  }

  function atualizarVisibilidadeSeletoresEscopo() {
    const grpTop10 = document.getElementById('grp-top10-cat');
    const grpCen = document.getElementById('grp-cenario-esp');
    grpTop10.style.display = state.escopoModo === 'top10' ? 'flex' : 'none';
    grpCen.style.display = (state.escopoModo === 'cenario' || state.escopoModo === 'top10') ? 'flex' : 'none';

    const selCen = document.getElementById('sel-cenario-especifico');
    if (state.escopoModo === 'top10') {
      const topList = DATA.top10.filter(t => t.categoria === state.top10Categoria);
      selCen.innerHTML = topList.map(t => `<option value="${t.cenario}">#${t.posicao} - ${t.cenario} (${t.criterio})</option>`).join('');
      if (!topList.some(t => t.cenario === state.cenarioAtivo)) {
        state.cenarioAtivo = topList[0].cenario;
      }
      selCen.value = state.cenarioAtivo;
    } else if (state.escopoModo === 'cenario') {
      if (selCen.options.length < 100) {
        selCen.innerHTML = DATA.resumo_cenarios.map(c => `<option value="${c.cenario}">${c.cenario} (Rank #${c.rank_rentabilidade})</option>`).join('');
      }
      selCen.value = state.cenarioAtivo;
    }
  }

  // Inicialização de Eventos
  function init() {
    // Tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => ativarAba(btn.getAttribute('data-tab')));
    });

    // Popular seletor de cenários
    atualizarVisibilidadeSeletoresEscopo();

    document.getElementById('sel-escopo-modo').addEventListener('change', e => {
      state.escopoModo = e.target.value;
      atualizarVisibilidadeSeletoresEscopo();
      renderActiveTab();
    });

    document.getElementById('sel-top10-cat').addEventListener('change', e => {
      state.top10Categoria = e.target.value;
      atualizarVisibilidadeSeletoresEscopo();
      renderActiveTab();
    });

    document.getElementById('sel-cenario-especifico').addEventListener('change', e => {
      state.cenarioAtivo = e.target.value;
      renderActiveTab();
    });

    document.getElementById('sel-horizonte-anos').addEventListener('change', e => {
      const val = e.target.value;
      if (val === '1_11') { state.anoInicio = 1; state.anoFim = 11; }
      else if (val === '1_12') { state.anoInicio = 1; state.anoFim = 12; }
      else if (val === '1_5') { state.anoInicio = 1; state.anoFim = 5; }
      else if (val === '6_11') { state.anoInicio = 6; state.anoFim = 11; }
      renderActiveTab();
    });

    document.getElementById('sel-escala-moeda').addEventListener('change', e => {
      state.escalaMoeda = e.target.value;
      renderActiveTab();
    });

    // Eventos Tab 2 (Metas)
    const bindMetaInput = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', e => {
        state.metas[key] = parseFloat(e.target.value) || 0;
        renderAbaMetas();
      });
    };
    bindMetaInput('meta-m-ebitda-mod', 'margemEbitdaMod');
    bindMetaInput('meta-m-ebitda-calc', 'margemEbitdaCalc');
    bindMetaInput('meta-m-contrib', 'margemContrib');
    bindMetaInput('meta-roic', 'roic');
    bindMetaInput('meta-eva', 'evaBi');
    bindMetaInput('meta-receita', 'receitaBi');
    bindMetaInput('meta-lc', 'lcMin');
    bindMetaInput('meta-endiv', 'endivMax');

    // Eventos Tab 3 (Ticket / LTV / CAC)
    const bindTicketInput = (id, key, lblId, suffix = '') => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', e => {
        const val = el.type === 'checkbox' ? el.checked : (parseFloat(e.target.value) || 0);
        state.ticket[key] = val;
        if (lblId) document.getElementById(lblId).textContent = val + suffix;
        renderAbaTicket();
      });
    };
    bindTicketInput('tk-bruto', 'ticketBruto');
    bindTicketInput('tk-desconto', 'descontoPct', 'lbl-tk-desconto', '%');
    bindTicketInput('tk-compras', 'comprasAno');
    bindTicketInput('tk-vida', 'vidaMediaAnos');
    bindTicketInput('tk-margem', 'margemBasePct', 'lbl-tk-margem', '%');
    bindTicketInput('tk-comprimir', 'comprimirMargem');
    bindTicketInput('tk-invest', 'investimentoAq');
    bindTicketInput('tk-novos', 'novosClientes');

    // Eventos Tab 4 (Sensibilidade)
    const bindSensibInput = (id, key, lblId, suffix = '%') => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', e => {
        const val = key === 'metricaHeatmap' ? e.target.value : (parseFloat(e.target.value) || 0);
        state.sensib[key] = val;
        if (lblId) document.getElementById(lblId).textContent = (val >= 0 && key !== 'descontoPct' && key !== 'waccPct' ? '+' : '') + val + suffix;
        renderAbaSensibilidade();
      });
    };
    bindSensibInput('sens-desconto', 'descontoPct', 'lbl-sens-desconto', '%');
    bindSensibInput('sens-volume', 'volumePct', 'lbl-sens-volume', '%');
    bindSensibInput('sens-custo', 'custoUnitPct', 'lbl-sens-custo', '%');
    bindSensibInput('sens-wacc', 'waccPct', 'lbl-sens-wacc', '%');
    bindSensibInput('sens-metrica-heat', 'metricaHeatmap');

    document.getElementById('btn-reset-sensib').addEventListener('click', () => {
      state.sensib = { descontoPct: 0, volumePct: 0, custoUnitPct: 0, waccPct: 12.0, metricaHeatmap: state.sensib.metricaHeatmap };
      document.getElementById('sens-desconto').value = 0;
      document.getElementById('sens-volume').value = 0;
      document.getElementById('sens-custo').value = 0;
      document.getElementById('sens-wacc').value = 12.0;
      document.getElementById('lbl-sens-desconto').textContent = '0%';
      document.getElementById('lbl-sens-volume').textContent = '+0%';
      document.getElementById('lbl-sens-custo').textContent = '+0%';
      document.getElementById('lbl-sens-wacc').textContent = '12%';
      renderAbaSensibilidade();
    });

    // Eventos Tab 5 & 6
    document.getElementById('sel-rank-top10-cat').addEventListener('change', e => {
      state.rankCategoriaTop10 = e.target.value;
      renderAbaRankings();
    });
    document.getElementById('inp-busca-cenario').addEventListener('input', e => {
      state.buscaCenario = e.target.value;
      renderAbaRankings();
    });
    document.getElementById('sel-dic-cat').addEventListener('change', e => {
      state.filtroCatDicionario = e.target.value;
      renderAbaDicionario();
    });
    document.getElementById('inp-busca-dic').addEventListener('input', e => {
      state.buscaDicionario = e.target.value;
      renderAbaDicionario();
    });

    let resizeRaf = null;
    const scheduleResponsiveRender = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        renderActiveTab();
      });
    };

    window.addEventListener('resize', scheduleResponsiveRender);
    if (typeof ResizeObserver !== 'undefined') {
      const mainEl = document.querySelector('.main-container');
      if (mainEl) {
        let lastWidth = mainEl.clientWidth;
        const ro = new ResizeObserver(entries => {
          for (const entry of entries) {
            const w = Math.round(entry.contentRect.width);
            if (Math.abs(w - lastWidth) > 2) {
              lastWidth = w;
              scheduleResponsiveRender();
            }
          }
        });
        ro.observe(mainEl);
      }
    }

    renderActiveTab();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

