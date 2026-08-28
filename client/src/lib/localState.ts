import type { Bet } from "./betting";

export const LOCAL_STATE_KEY = "controle-apostas-state-v2";
export const LEGACY_BETS_KEY = "controle-apostas-bets";
export const LEGACY_BALANCE_KEY = "controle-apostas-manual-balance";

export type LocalPanelState = {
  bets: Bet[];
  manualBalance: string;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

function normalizeBets(value: unknown): Bet[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((bet, index) => ({
    ...bet,
    groupId: Number.isFinite(bet?.groupId) ? bet.groupId : Math.floor(index / 2) + 1,
  }));
}

export function readLocalPanelState(storage: StorageReader, initialBets: Bet[]): LocalPanelState {
  try {
    const combined = JSON.parse(storage.getItem(LOCAL_STATE_KEY) ?? "null");
    const bets = normalizeBets(combined?.bets);
    if (bets) {
      return {
        bets,
        manualBalance: typeof combined.manualBalance === "string" ? combined.manualBalance : "",
      };
    }
  } catch {
    // Fall back to the legacy keys below.
  }

  let legacyBets: Bet[] | null = null;
  try {
    legacyBets = normalizeBets(JSON.parse(storage.getItem(LEGACY_BETS_KEY) ?? "null"));
  } catch {
    legacyBets = null;
  }

  return {
    bets: legacyBets ?? initialBets,
    manualBalance: storage.getItem(LEGACY_BALANCE_KEY) ?? "",
  };
}

export function writeLocalPanelState(storage: StorageWriter, state: LocalPanelState) {
  storage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  // Keep older installed versions compatible during the migration.
  storage.setItem(LEGACY_BETS_KEY, JSON.stringify(state.bets));
  storage.setItem(LEGACY_BALANCE_KEY, state.manualBalance);
}
