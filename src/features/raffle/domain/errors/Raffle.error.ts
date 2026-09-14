export class RaffleNotFoundError extends Error {
	constructor(id: string) {
		super(`Sorteo no encontrado: ${id}`);
		this.name = "RaffleNotFoundError";
	}
}

export class RaffleNotActiveError extends Error {
	constructor(id: string) {
		super(`El sorteo ${id} no está activo para esta operación`);
		this.name = "RaffleNotActiveError";
	}
}

export class RaffleAlreadyDrawnError extends Error {
	constructor(id: string) {
		super(`El sorteo ${id} ya tiene un ganador sorteado`);
		this.name = "RaffleAlreadyDrawnError";
	}
}

export class NoTicketsPurchasedError extends Error {
	constructor(id: string) {
		super(`El sorteo ${id} no tiene tickets comprados para sortear`);
		this.name = "NoTicketsPurchasedError";
	}
}
