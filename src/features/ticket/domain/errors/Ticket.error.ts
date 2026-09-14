import { AppError } from "@/shared/errors/AppError.js";

export class RaffleNotFoundError extends Error {
	constructor(id: string) {
		super(`Raffle no encontrada: ${id}`);
		this.name = "RaffleNotFoundError";
	}
}

export class RaffleNotActiveError extends Error {
	constructor(id: string) {
		super(`La raffle ${id} no está activa para esta operación`);
		this.name = "RaffleNotActiveError";
	}
}

export class RaffleSoldOutError extends AppError {
	constructor(id: string) {
		super(
			`La raffle ${id} no tiene más tickets disponibles`,
			409,
			"RaffleSoldOutError",
		);
	}
}

export class TicketNotFoundError extends Error {
	constructor(id: string) {
		super(`Ticket no encontrado: ${id}`);
		this.name = "TicketNotFoundError";
	}
}
