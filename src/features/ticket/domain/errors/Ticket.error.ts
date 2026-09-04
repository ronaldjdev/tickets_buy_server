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

export class RaffleSoldOutError extends Error {
	constructor(id: string) {
		super(`La raffle ${id} no tiene más tickets disponibles`);
		this.name = "RaffleSoldOutError";
	}
}

export class TicketNotFoundError extends Error {
	constructor(id: string) {
		super(`Ticket no encontrado: ${id}`);
		this.name = "TicketNotFoundError";
	}
}
