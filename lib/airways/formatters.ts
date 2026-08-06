/** Shared formatting helpers used by boarding-pass and champion-kit builders. */

export function seatNum(age: number | null, n: number): string {
  return `${age ?? n}A`
}

export function gateNum(n: number): string {
  return `G${n}`
}

/** Returns the status label for the child's current story position. */
export function statusLabel(n: number): string {
  return n >= 7 ? 'GRAND CHAMPION' : 'PETIT CHAMPION'
}
