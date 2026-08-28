/**
 * Direção visual: Quadro de Operação — dashboard editorial utilitário.
 * Este arquivo concentra a experiência de lançamento e os cálculos derivados.
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { calculateEventSummaries, removeBetGroup, type Bet } from "@/lib/betting";
import { readLocalPanelState, writeLocalPanelState } from "@/lib/localState";
import {
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  Calculator,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Info,
  Plus,
  RotateCcw,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const initialBets: Bet[] = [
  { id: 1, groupId: 1, event: "Sexta 20:30", market: "Resultado do jogo", selection: "Nautico", odd: 2, stake: 25 },
  { id: 2, groupId: 1, event: "Sexta 20:30", market: "Resultado do jogo", selection: "Empate", odd: 3.1, stake: 25 },
  { id: 3, groupId: 2, event: "Sexta 14:00", market: "Resultado do jogo", selection: "Racing Santander", odd: 2.1, stake: 25 },
  { id: 4, groupId: 2, event: "Sexta 14:00", market: "Resultado do jogo", selection: "Empate", odd: 3.5, stake: 25 },
];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(value: number) {
  return money.format(value).replace("R$", "R$");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function Home() {
  const [initialLocalState] = useState(() => readLocalPanelState(localStorage, initialBets));
  const [bets, setBets] = useState<Bet[]>(initialLocalState.bets);
  const [manualBalance, setManualBalance] = useState(initialLocalState.manualBalance);

  useEffect(() => {
    writeLocalPanelState(localStorage, { bets, manualBalance });
  }, [bets, manualBalance]);
  const [newDay, setNewDay] = useState("Sexta");
  const [newTime, setNewTime] = useState("20:30");
  const [newMarket, setNewMarket] = useState("Resultado do jogo");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamOdd, setNewTeamOdd] = useState("2.00");
  const [newDrawOdd, setNewDrawOdd] = useState("3.10");
  const [newStake, setNewStake] = useState("25.00");

  const eventSummaries = useMemo(() => calculateEventSummaries(bets), [bets]);

  const totalInvested = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const bestProfit = eventSummaries.reduce((sum, item) => sum + item.best, 0);
  const worstProfit = eventSummaries.length ? eventSummaries.reduce((sum, item) => sum + Math.min(...item.scenarios.map((scenario: { profit: number }) => scenario.profit)), 0) : 0;
  const averageOdd = bets.length ? bets.reduce((sum, bet) => sum + bet.odd, 0) / bets.length : 0;
  const profitChartData = useMemo(() => eventSummaries.flatMap((summary) => summary.scenarios.map((scenario) => ({ id: scenario.id, selection: scenario.selection, event: summary.event, profit: scenario.profit }))), [eventSummaries]);
  const chartMax = Math.max(...profitChartData.map((item) => Math.abs(item.profit)), 1);
  const previewTeamName = newTeamName.trim() || "time";
  const previewStake = Number(newStake.replace(",", ".")) || 0;
  const previewTotalInvested = previewStake * 2;
  const previewTeamReturn = (Number(newTeamOdd.replace(",", ".")) || 0) * previewStake;
  const previewDrawReturn = (Number(newDrawOdd.replace(",", ".")) || 0) * previewStake;
  const previewTeamProfit = previewTeamReturn - previewTotalInvested;
  const previewDrawProfit = previewDrawReturn - previewTotalInvested;

  function clearAll() {
    if (!window.confirm("Isso vai apagar todos os lançamentos e zerar o cálculo. Deseja continuar?")) return;
    setBets([]);
    setNewDay("Sexta");
    setNewTime("20:30");
    setNewMarket("Resultado do jogo");
    setNewTeamName("");
    setNewTeamOdd("2.00");
    setNewDrawOdd("3.10");
    setNewStake("25.00");
    toast.success("Tudo limpo. Você já pode começar um novo cálculo.");
  }

  function updateBet(id: number, key: keyof Bet, value: string) {
    setBets((current) => current.map((bet) => {
      if (bet.id !== id) return bet;
      if (key === "selection" && (bet.selection === "Empate" || value.trim().toLowerCase() === "empate")) return bet;
      if (key === "odd" || key === "stake") return { ...bet, [key]: Number(value.replace(",", ".")) || 0 };
      return { ...bet, [key]: value };
    }));
  }

  function addBet(event?: string) {
    const teamName = newTeamName.trim();
    if (!teamName) {
      toast.error("Informe o nome do time antes de adicionar.");
      return;
    }
    const selectedEvent = event ?? `${newDay} ${newTime}`;
    const teamStake = Number(newStake.replace(",", ".")) || 0;
    setBets((current) => {
      const nextId = Math.max(0, ...current.map((bet) => bet.id)) + 1;
      const nextGroupId = Math.max(0, ...current.map((bet) => bet.groupId)) + 1;
      return [...current,
        { id: nextId, groupId: nextGroupId, event: selectedEvent, market: newMarket, selection: teamName, odd: Number(newTeamOdd.replace(",", ".")) || 0, stake: teamStake },
        { id: nextId + 1, groupId: nextGroupId, event: selectedEvent, market: newMarket, selection: "Empate", odd: Number(newDrawOdd.replace(",", ".")) || 0, stake: teamStake },
      ];
    });
    setNewTeamName("");
    toast.success("Time e empate adicionados; cálculos atualizados.");
  }

  function removeBlock(groupId: number) {
    setBets((current) => removeBetGroup(current, groupId));
    toast.success("Bloco removido. Os outros lançamentos foram mantidos.");
  }

  function removeBet(id: number) {
    setBets((current) => current.filter((bet) => bet.id !== id));
    toast.success("Lançamento removido.");
  }

  function resetData() {
    setBets(initialBets);
    toast.success("Dados originais da planilha restaurados.");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><i /></div>
          <div><strong>controle</strong><small>de apostas</small></div>
        </div>
        <div className="side-rule" />
        <p className="eyebrow">Painel operacional</p>
        <nav className="side-nav" aria-label="Navegação principal">
          <a className="active" href="#visao-geral"><BarChart3 size={17} /> Visão geral</a>
          <a href="#lancamentos"><ClipboardList size={17} /> Lançamentos <b>{bets.length}</b></a>
          <a href="#cenarios"><Calculator size={17} /> Cenários</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="side-note"><Info size={15} /><span>Os cálculos são atualizados a cada alteração.</span></div>
          <button className="quiet-button" onClick={resetData}><RotateCcw size={15} /> Restaurar planilha</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">Controle / Visão geral</p><h1>Enxergue a conta antes do placar.</h1></div>
          <div className="topbar-meta"><span className="status-dot" /> dados locais <span className="divider" /> atualizado agora <span className="divider" /> <a href="https://www.bet365.com" target="_blank" rel="noopener noreferrer" className="bet365-button" aria-label="Abrir o site da Bet365 em uma nova aba" title="Abrir Bet365"><ExternalLink size={18} strokeWidth={2.4} /><span>ABRIR BET365</span><ArrowUpRight size={15} strokeWidth={2.4} /></a></div>
        </header>

        <section className="hero-strip" id="visao-geral">
          <div><span className="section-kicker">Resumo da operação</span><h2>Uma leitura rápida do seu mercado.</h2><p>Organize cada seleção, compare cenários e acompanhe o que está em jogo sem esconder nenhuma conta.</p></div>
          <div className="hero-art"><img src="/manus-storage/controle-site-cover-v2_5a7b578d.png" alt="Ilustração editorial de uma ficha de jogo" /></div>
        </section>

        <section className="kpi-grid" aria-label="Indicadores principais">
          <article className="kpi-card"><div className="kpi-label"><WalletCards size={16} /> total investido</div><strong>{formatMoney(totalInvested)}</strong><span>em {eventSummaries.length} {eventSummaries.length === 1 ? "evento" : "eventos"}</span></article>
          <article className="kpi-card accent"><div className="kpi-label"><TrendingUp size={16} /> melhor cenário</div><strong className="green-text">{formatMoney(bestProfit)}</strong><span>lucro potencial combinado</span></article>
          <article className="kpi-card worst"><div className="kpi-label"><TrendingDown size={16} /> pior cenário</div><strong className={worstProfit < 0 ? "negative" : "neutral-value"}>{formatMoney(worstProfit)}</strong><span>menor lucro possível combinado</span></article>
          <article className="kpi-card"><div className="kpi-label"><CircleDollarSign size={16} /> odd média</div><strong>{number.format(averageOdd)}</strong><span>entre {bets.length} seleções</span></article>
          <article className="kpi-card"><div className="kpi-label"><ArrowUpRight size={16} /> seleções</div><strong>{bets.length}</strong><span>lançamentos acompanhados</span></article>
        </section>

        <div className="content-grid">
          <section className="panel" id="cenarios">
            <div className="panel-heading"><div><span className="section-kicker">Leitura por evento</span><span className="market-line" /><h2>Cenários de retorno</h2>                <p className="section-explainer">Cada lançamento fica separado: retorno da aposta menos o total investido neste bloco.</p></div><span className="tiny-tag">automático</span></div>
            <div className="scenario-list">
              {eventSummaries.map((summary, summaryIndex) => (
                <article className="scenario-card" key={summary.groupId}>
                  <div className="scenario-head"><div><span className="event-index"><i />0{summaryIndex + 1}</span><strong>{summary.event}</strong></div><span className="invested invested-amount"><WalletCards size={16} /><span>investido <strong>{formatMoney(summary.total)}</strong></span></span><button type="button" className="scenario-delete" onClick={() => removeBlock(summary.groupId)} title={`Excluir bloco ${summary.event}`} aria-label={`Excluir bloco ${summary.event}`}><Trash2 size={16} /></button></div>
                  <div className="scenario-options">
                    {summary.scenarios.map((scenario: Bet & { returnValue: number; profit: number; roi: number }) => (
                      <div className="scenario-option" key={scenario.id}>
                        <div><strong>{scenario.selection}</strong><span>{scenario.market} · odd {number.format(scenario.odd)}</span></div>
                        <div className="scenario-result"><span className="result-label">retorno total</span><b className="return-value">{formatMoney(scenario.returnValue)}</b><span className="profit-line">lucro líquido <strong className={scenario.profit >= 0 ? "positive" : "negative"}>{scenario.profit >= 0 ? "+" : ""}{formatMoney(scenario.profit)}</strong></span><span className="scenario-equation">{formatMoney(scenario.returnValue)} − {formatMoney(summary.total)} = {formatMoney(scenario.profit)}</span><span>ROI {number.format(scenario.roi * 100)}%</span></div>
                      </div>
                    ))}
                  </div>
                  <div className="scenario-foot"><span>melhor cenário <b>{formatMoney(summary.best)}</b></span><span className="lime-chip"><Check size={13} /> calculado</span></div>
                </article>
              ))}
              {eventSummaries.length === 0 && <div className="empty-state">Nenhum evento cadastrado. Adicione uma seleção ao lado para começar.</div>}
            </div>
          </section>

          <aside className="side-column">
            <section className="panel add-panel">
            <div className="panel-heading"><div><span className="section-kicker">Novo lançamento</span><h2>Adicionar seleção</h2></div><div className="plus-badge"><Plus size={17} /></div></div>
            <p className="panel-intro">Informe o time e as odds. A opção Empate é adicionada automaticamente e permanece fixa. Cada novo lançamento cria um bloco independente de cálculo.</p>
            <div className="form-stack">
              <div className="form-row event-fields"><Field label="dia do evento"><select value={newDay} onChange={(e) => setNewDay(e.target.value)}>{weekdays.map((day) => <option key={day}>{day}</option>)}</select></Field><Field label="horário"><input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} /></Field></div>
              <Field label="mercado"><input value={newMarket} onChange={(e) => setNewMarket(e.target.value)} placeholder="Resultado do jogo" /></Field>
              <Field label="nome do time"><input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Ex.: Nautico" /></Field>
              <div className="form-row"><Field label="odd do time"><input inputMode="decimal" value={newTeamOdd} onChange={(e) => setNewTeamOdd(e.target.value)} /></Field><Field label="odd do empate"><input inputMode="decimal" value={newDrawOdd} onChange={(e) => setNewDrawOdd(e.target.value)} /></Field></div>
              <Field label="valor apostado em cada opção"><input inputMode="decimal" value={newStake} onChange={(e) => setNewStake(e.target.value)} /></Field>
              <button className="primary-button" onClick={() => addBet()}><Plus size={17} /> Adicionar time + empate <ArrowUpRight size={16} /></button><button type="button" className="clear-button" onClick={clearAll}><Trash2 size={15} /> Limpar tudo</button>
            </div>
            <div className="scenario-preview"><div className="preview-heading"><span className="section-kicker">Cenários independentes</span><span>prévia</span></div><div className="preview-grid"><div className="preview-scenario"><span>se {previewTeamName} vencer</span><b>{formatMoney(previewTeamReturn)}</b><small>lucro líquido <strong className={previewTeamProfit >= 0 ? "positive" : "negative"}>{previewTeamProfit >= 0 ? "+" : ""}{formatMoney(previewTeamProfit)}</strong></small></div><div className="preview-scenario"><span>se der empate</span><b>{formatMoney(previewDrawReturn)}</b><small>lucro líquido <strong className={previewDrawProfit >= 0 ? "positive" : "negative"}>{previewDrawProfit >= 0 ? "+" : ""}{formatMoney(previewDrawProfit)}</strong></small></div></div><p>Retorno total de cada cenário, descontado o investimento de {formatMoney(previewTotalInvested)}.</p></div>
            <div className="form-tip"><span className="tip-line" /> <span>Escolha qualquer dia e horário. O time e as duas odds são editáveis; “Empate” permanece fixo.</span></div>
            </section>

            <section className="panel manual-balance-panel" aria-labelledby="manual-balance-title">
              <div className="manual-balance-heading"><div><span className="section-kicker">Referência pessoal</span><h2 id="manual-balance-title">Dinheiro disponível</h2></div><span className="manual-tag">não calcula</span></div>
              <p className="manual-balance-intro">Informe manualmente quanto você tem para acompanhar ao lado das suas apostas.</p>
              <label className="manual-balance-field" htmlFor="manual-balance-input"><span>saldo informado</span><div className="manual-balance-input"><b aria-hidden="true">R$</b><input id="manual-balance-input" inputMode="decimal" value={manualBalance} onChange={(event) => setManualBalance(event.target.value)} placeholder="0,00" /></div></label>
              <p className="manual-balance-note"><Info size={14} /> Este valor é apenas informativo e não altera nenhum cálculo.</p>
            </section>
          </aside>
        </div>

        <section className="panel chart-panel" id="grafico"><div className="panel-heading"><div><span className="section-kicker">Comparativo visual</span><span className="market-line" /><h2>Lucro por cenário</h2><p className="section-explainer">Compare o lucro líquido de cada resultado possível em uma única leitura.</p></div><span className="tiny-tag">{profitChartData.length} cenários</span></div><div className="profit-chart" role="img" aria-label="Gráfico de barras comparando o lucro líquido por cenário">{profitChartData.length === 0 ? <div className="empty-state">Adicione uma seleção para visualizar o gráfico.</div> : profitChartData.map((item) => <div className="chart-row" key={item.id}><div className="chart-label"><strong>{item.selection}</strong><span>{item.event}</span></div><div className="bar-track"><div className={`profit-bar ${item.profit < 0 ? "negative" : ""}`} style={{ width: `${item.profit === 0 ? 0 : Math.max(5, Math.abs(item.profit) / chartMax * 100)}%` }} /></div><b className={item.profit >= 0 ? "positive" : "negative"}>{item.profit >= 0 ? "+" : ""}{formatMoney(item.profit)}</b></div>)}</div></section>

        <section className="panel table-panel" id="lancamentos">
          <div className="panel-heading"><div><span className="section-kicker">Base de dados</span><span className="market-line" /><h2>Lançamentos</h2></div><span className="tiny-tag">{bets.length} registros</span></div>
          <div className="table-wrap"><table><thead><tr><th>evento</th><th>mercado</th><th>seleção</th><th>odd</th><th>valor apostado</th><th>retorno</th><th>lucro potencial</th><th aria-label="ações" /></tr></thead><tbody>
            {bets.map((bet) => {
              const groupTotal = bets.filter((item) => item.groupId === bet.groupId).reduce((sum, item) => sum + item.stake, 0);
              const returnValue = bet.odd * bet.stake;
              const profit = returnValue - groupTotal;
              return <tr key={bet.id}><td><input className="cell-input event-input" value={bet.event} onChange={(e) => updateBet(bet.id, "event", e.target.value)} /></td><td><input className="cell-input" value={bet.market} onChange={(e) => updateBet(bet.id, "market", e.target.value)} /></td><td>{bet.selection === "Empate" ? <span className="fixed-selection"><Check size={12} /> Empate fixo</span> : <input className="cell-input selection-input" value={bet.selection} onChange={(e) => updateBet(bet.id, "selection", e.target.value)} />}</td><td><input className="cell-input number-input" inputMode="decimal" value={bet.odd} onChange={(e) => updateBet(bet.id, "odd", e.target.value)} /></td><td><input className="cell-input money-input" inputMode="decimal" value={bet.stake} onChange={(e) => updateBet(bet.id, "stake", e.target.value)} /></td><td className="calculated">{formatMoney(returnValue)}</td><td className={profit >= 0 ? "calculated positive" : "calculated negative"}>{profit >= 0 ? "+" : ""}{formatMoney(profit)}</td><td><button className="icon-button danger" title="Remover lançamento" onClick={() => removeBet(bet.id)}><Trash2 size={16} /></button></td></tr>;
            })}
          </tbody></table></div>
          <div className="table-footer"><span><span className="status-dot" /> Tudo salvo localmente neste navegador</span><span>Retorno total = odd × valor · lucro = retorno − total investido</span></div>
        </section>
        <footer className="footer-note">Controle de Apostas <span>·</span> uma ferramenta para acompanhar decisões com mais clareza.</footer>
      </main>
    </div>
  );
}
