export type RaffleStatus = "draft" | "active" | "drawn";

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

export type RafflePrize = {
	type: RafflePrizeType;
	name: string;
	description?: string;
	schedule?: RafflePrizeSchedule;
};

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
	status: RaffleStatus;
	winnerTicketId?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
