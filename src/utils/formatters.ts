/**
 * Converts satoshis to BTC.
 */
export function satoshisToBtc(satoshis: number): string {
    return (satoshis / 100_000_000).toFixed(8);
}

/**
 * Formats a balance for display.
 */
export function formatBalance(satoshis: number): string {
    return `${satoshisToBtc(satoshis)} BTC (${satoshis.toLocaleString()} sats)`;
}
