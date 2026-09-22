import type { MachinePlaysRule } from "../contracts/IMachineSettings.contract.js";

/** Regla por defecto (1 tiro por cada 5 boletos) si no hay regla global ni por sorteo. */
export const DEFAULT_PLAYS_RULE: MachinePlaysRule = { every: 5, plays: 1 };

/**
 * Calcula los tiros de la máquina otorgados por una compra:
 * - Regla efectiva: regla del sorteo > regla global > default.
 * - Tiros por boletos: floor(cantidad / every) * plays (si every > 0).
 * - Se suman los tiros fijos del combo (si la compra es por combo).
 */
export function computeMachinePlays({
	quantity,
	raffleRule,
	globalRule,
	comboPlays = 0,
}: {
	quantity: number;
	raffleRule?: MachinePlaysRule | null;
	globalRule?: MachinePlaysRule | null;
	comboPlays?: number;
}): number {
	const rule = raffleRule ?? globalRule ?? DEFAULT_PLAYS_RULE;
	const byTickets =
		rule && rule.every > 0 ? Math.floor(quantity / rule.every) * rule.plays : 0;
	return byTickets + (Number.isFinite(comboPlays) ? comboPlays : 0);
}
