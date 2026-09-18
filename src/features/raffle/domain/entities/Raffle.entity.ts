export type RaffleStatus = "draft" | "active" | "drawn";

export type TicketIssuanceMode = "random" | "consecutive";

export const TICKET_ISSUANCE_MODES: TicketIssuanceMode[] = [
	"random",
	"consecutive",
];

export function isTicketIssuanceMode(
	value: unknown,
): value is TicketIssuanceMode {
	return (
		typeof value === "string" &&
		(TICKET_ISSUANCE_MODES as string[]).includes(value)
	);
}

export type RafflePrizeType = "mayor" | "seco1" | "seco2" | "seco3" | "seco4";

export const PRIZE_LABELS: Record<RafflePrizeType, string> = {
	mayor: "Premio mayor",
	seco1: "1 seco",
	seco2: "2 seco",
	seco3: "3 seco",
	seco4: "4 seco",
};

export type RafflePrizeSchedule =
	| { mode: "weekday"; weekday: number }
	| { mode: "date"; date: string };

export type WinningNumberStatus = "blocked" | "enabled" | "expedited";

export type RafflePrize = {
	type: RafflePrizeType;
	name: string;
	description?: string;
	imageUrl?: string;
	schedule?: RafflePrizeSchedule;
	/**
	 * Número ganador fijo del premio (p.ej. 7). Mientras no se expida, ese
	 * número queda bloqueado: no se entrega ni aleatoria ni consecutivamente.
	 */
	winningNumber?: number;
	/**
	 * Mínimo de boletos vendidos necesario para que el número ganador pase de
	 * "bloqueado" a "habilitado". Si se omite, queda bloqueado hasta que un
	 * admin lo expida manualmente.
	 */
	winningMinSoldTickets?: number;
	/** Fecha (ISO) de expedición manual del número ganador. */
	winningExpeditedAt?: string;
	/** Identificador del admin que expidió el número ganador. */
	winningExpeditedBy?: string;
	/** Fecha ISO en que el premio fue entregado vía máquina de tiros. */
	machineClaimedAt?: string;
	/** Compra (purchaseId) que reclamó el premio en la máquina. */
	machineClaimedByPurchaseId?: string;
};

/**
 * Configuración de un premio del pool de la máquina de tiros.
 * - kind "seco": premio seco del sorteo.
 * - kind "instant": premio instantáneo propio de la máquina, con stock limitado.
 */
export type MachinePrizeConfig =
	| {
			kind: "seco";
			prizeType: RafflePrizeType;
			winRate: number;
	  }
	| {
			kind: "instant";
			id: string;
			name: string;
			description?: string;
			imageUrl?: string;
			stock: number;
			winRate: number;
	  };

/** Pool de premios jugables de la máquina de tiros de una sorteo. */
export type RaffleMachineConfig = {
	prizes: MachinePrizeConfig[];
};

/**
 * Valida el pool de la máquina: solo premios secos o instantáneos, con su
 * respectivo % (suma ≤ 100), stock válido y sin duplicados.
 */
export function validateMachineConfig(
	machine: RaffleMachineConfig | undefined,
	prizes: RafflePrize[] | undefined,
): void {
	if (!machine) return;
	if (!machine.prizes || !Array.isArray(machine.prizes)) {
		throw new Error("machine.prizes debe ser un arreglo");
	}
	let total = 0;
	const secoSeen = new Set<RafflePrizeType>();
	const instantSeen = new Set<string>();
	for (const prize of machine.prizes) {
		if (
			!Number.isFinite(prize.winRate) ||
			prize.winRate <= 0 ||
			prize.winRate > 100
		) {
			throw new Error(
				"El porcentaje de cada premio de la máquina debe estar entre 0 (excluido) y 100",
			);
		}
		total += prize.winRate;
		if (prize.kind === "seco") {
			if (!prize.prizeType.startsWith("seco")) {
				throw new Error(
					"La máquina solo puede jugar por premios secos del sorteo",
				);
			}
			if (!(prizes ?? []).some((p) => p.type === prize.prizeType)) {
				throw new Error(
					`El premio seco ${prize.prizeType} no existe en la sorteo`,
				);
			}
			if (secoSeen.has(prize.prizeType)) {
				throw new Error(
					`El premio seco ${prize.prizeType} no puede repetirse en la máquina`,
				);
			}
			secoSeen.add(prize.prizeType);
		} else {
			if (!prize.id?.trim() || !prize.name?.trim()) {
				throw new Error(
					"Los premios instantáneos de la máquina requieren id y nombre",
				);
			}
			if (
				prize.imageUrl !== undefined &&
				typeof prize.imageUrl !== "string"
			) {
				throw new Error("La imagen de un premio instantáneo debe ser una URL");
			}
			if (!Number.isInteger(prize.stock) || prize.stock < 1) {
				throw new Error(
					"El stock de un premio instantáneo debe ser un entero mayor o igual a 1",
				);
			}
			if (instantSeen.has(prize.id)) {
				throw new Error(
					`El premio instantáneo "${prize.id}" no puede repetirse en la máquina`,
				);
			}
			instantSeen.add(prize.id);
		}
	}
	if (total > 100) {
		throw new Error(
			"La suma de los porcentajes de la máquina no puede superar 100",
		);
	}
}

/**
 * Deriva el estado del número ganador: null si no hay número configurado;
 * "expedited" si ya se expidió; "enabled" si se alcanzó el mínimo de ventas;
 * "blocked" en cualquier otro caso.
 */
export function getWinningNumberStatus(
	prize: RafflePrize,
	soldTickets: number,
): WinningNumberStatus | null {
	if (prize.winningNumber === undefined) return null;
	if (prize.winningExpeditedAt) return "expedited";
	if (
		prize.winningMinSoldTickets !== undefined &&
		soldTickets >= prize.winningMinSoldTickets
	) {
		return "enabled";
	}
	return "blocked";
}

/**
 * Valida la configuración de números ganadores de los premios contra el
 * máximo de boletos del sorteo (rango, mínimo, duplicados y consistencia).
 */
export function validateWinningNumberConfig(
	prizes: RafflePrize[] | undefined,
	maxTickets: number,
): void {
	if (!prizes) return;
	const seen = new Set<number>();
	for (const prize of prizes) {
		if (prize.winningNumber === undefined) {
			if (
				prize.winningMinSoldTickets !== undefined ||
				prize.winningExpeditedAt !== undefined
			) {
				throw new Error(
					"El premio define mínimo o expedición sin un número ganador",
				);
			}
			continue;
		}
		if (
			!Number.isInteger(prize.winningNumber) ||
			prize.winningNumber < 1 ||
			prize.winningNumber > maxTickets
		) {
			throw new Error(
				`El número ganador debe ser un entero entre 1 y ${maxTickets}`,
			);
		}
		if (seen.has(prize.winningNumber)) {
			throw new Error(
				`El número ganador ${prize.winningNumber} no puede asignarse a dos premios`,
			);
		}
		seen.add(prize.winningNumber);
		if (prize.winningMinSoldTickets !== undefined) {
			if (
				!Number.isInteger(prize.winningMinSoldTickets) ||
				prize.winningMinSoldTickets < 1 ||
				prize.winningMinSoldTickets > maxTickets
			) {
				throw new Error(
					`El mínimo de ventas del número ganador debe ser un entero entre 1 y ${maxTickets}`,
				);
			}
		}
	}
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
	if (!DATE_PATTERN.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

/**
 * Valida la configuración de fecha de sorteo de un premio seco.
 * Arroja Error con mensaje descriptivo si la configuración es inválida.
 */
export function validatePrizeSchedule(schedule: RafflePrizeSchedule): void {
	if (!schedule || typeof schedule !== "object") {
		throw new Error("schedule debe ser un objeto");
	}
	if (schedule.mode === "weekday") {
		if (
			!Number.isInteger(schedule.weekday) ||
			schedule.weekday < 1 ||
			schedule.weekday > 7
		) {
			throw new Error(
				"El día de la semana debe ser un entero entre 1 (Lunes) y 7 (Domingo)",
			);
		}
		return;
	}
	if (schedule.mode === "date") {
		if (!schedule.date || !isValidDateString(schedule.date)) {
			throw new Error(
				"La fecha específica debe tener formato YYYY-MM-DD y ser válida",
			);
		}
		return;
	}
	throw new Error("mode debe ser 'weekday' o 'date'");
}

/**
 * Valida los premios de una rifa: el schedule solo aplica a premios secos.
 */
export function validatePrizes(prizes: RafflePrize[] | undefined): void {
	if (!prizes) return;
	for (const prize of prizes) {
		if (!prize || typeof prize.type !== "string") {
			throw new Error("Cada premio debe tener un tipo");
		}
		if (prize.type !== "mayor" && prize.imageUrl !== undefined) {
			throw new Error("Solo el premio mayor puede incluir una imagen");
		}
		if (prize.imageUrl !== undefined && typeof prize.imageUrl !== "string") {
			throw new Error("La imagen del premio mayor debe ser una URL");
		}
		if (prize.type === "mayor" && prize.schedule) {
			throw new Error(
				"El premio mayor no puede definir fecha de sorteo propia",
			);
		}
		if (prize.type.startsWith("seco") && prize.schedule) {
			validatePrizeSchedule(prize.schedule);
		}
	}
}

export interface Raffle {
	id: string;
	slug: string;
	title: string;
	description?: string;
	prizes?: RafflePrize[];
	startDate: Date;
	endDate: Date;
	ticketPrice: number;
	maxTickets: number;
	minTickets?: number;
	ticketIssuance?: TicketIssuanceMode;
	status: RaffleStatus;
	winnerTicketId?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
