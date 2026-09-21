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

export class PrizeWithoutWinningNumberError extends Error {
	constructor(raffleId: string, prizeType: string) {
		super(
			`El premio ${prizeType} del sorteo ${raffleId} no tiene número ganador`,
		);
		this.name = "PrizeWithoutWinningNumberError";
	}
}

export class WinningNumberAlreadyExpeditedError extends Error {
	constructor(raffleId: string, prizeType: string) {
		super(`El número ganador del premio ${prizeType} ya fue expedido`);
		this.name = "WinningNumberAlreadyExpeditedError";
	}
}

export class WinningNumberSalesNotReachedError extends Error {
	constructor(raffleId: string, prizeType: string, minimum: number) {
		super(
			`El premio ${prizeType} requiere mínimo ${minimum} boletos vendidos para expedir su número ganador y aún no se alcanzan.`,
		);
		this.name = "WinningNumberSalesNotReachedError";
	}
}
