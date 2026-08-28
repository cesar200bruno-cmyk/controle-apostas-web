export type Bet = {
  id: number;
  groupId: number;
  event: string;
  market: string;
  selection: string;
  odd: number;
  stake: number;
};

export type Scenario = Bet & {
  returnValue: number;
  profit: number;
  roi: number;
};

export type EventSummary = {
  groupId: number;
  event: string;
  entries: Bet[];
  total: number;
  scenarios: Scenario[];
  best: number;
};

export function calculateEventSummaries(bets: Bet[]): EventSummary[] {
  const grouped = new Map<number, Bet[]>();

  bets.forEach((bet) => {
    grouped.set(bet.groupId, [...(grouped.get(bet.groupId) ?? []), bet]);
  });

  return Array.from(grouped.entries()).map(([groupId, entries]) => {
    const event = entries[0]?.event ?? "Evento";
    const total = entries.reduce((sum, bet) => sum + bet.stake, 0);
    const scenarios = entries.map((bet) => {
      const returnValue = bet.odd * bet.stake;
      const profit = returnValue - total;
      return {
        ...bet,
        returnValue,
        profit,
        roi: total ? profit / total : 0,
      };
    });

    return {
      groupId,
      event,
      entries,
      total,
      scenarios,
      best: Math.max(...scenarios.map((scenario) => scenario.profit), 0),
    };
  });
}

export function removeBetGroup(bets: Bet[], groupId: number): Bet[] {
  return bets.filter((bet) => bet.groupId !== groupId);
}
