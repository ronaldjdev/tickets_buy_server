/**
 * Ajuste manual de tiros de la máquina para un documento y sorteo.
 * Es un ledger auditable: `delta` positivo otorga tiros y negativo los quita.
 * El saldo por (documento, sorteo) suma las compras pagadas, estos ajustes y
 * resta los tiros jugados.
 */
export interface MachineGrant {
	id: string;
	documentNumber: string;
	raffleId: string;
	delta: number;
	note?: string;
	createdBy?: string;
	createdAt?: Date;
}
