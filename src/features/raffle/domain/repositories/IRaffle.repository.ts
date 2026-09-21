import type { Raffle } from "../entities/Raffle.entity.js";

export interface RaffleQuery {
	status?: Raffle["status"];
	limit?: number;
	offset?: number;
}

export interface IRaffleRepository {
	findById(id: string): Promise<Raffle | null>;
	findBySlug(slug: string): Promise<Raffle | null>;
	list(query: RaffleQuery): Promise<Raffle[]>;
	save(raffle: Raffle): Promise<Raffle>;
	update(raffle: Raffle): Promise<Raffle>;
	delete(id: string): Promise<void>;
	deactivateActiveRaffles(exceptRaffleId: string): Promise<void>;
	/**
	 * Marca un premio seco como reclamado por la máquina. Devuelve false si el
	 * premio ya estaba reclamado o la rifa no existe.
	 */
	claimMachineSecoPrize(
		raffleId: string,
		prizeType: string,
		claimedByPurchaseId: string,
	): Promise<boolean>;
	/**
	 * Decrementa en 1 el stock de un premio instantáneo de la máquina. Devuelve
	 * false si no hay stock o el premio no existe.
	 */
	decrementMachineInstantStock(
		raffleId: string,
		prizeId: string,
	): Promise<boolean>;
	/**
	 * Libera un premio seco reclamado por la máquina (lo devuelve al pool).
	 * Devuelve false si no estaba reclamado o la rifa no existe.
	 */
	releaseMachineSecoPrize(
		raffleId: string,
		prizeType: string,
	): Promise<boolean>;
	/**
	 * Suma `amount` al stock de un premio instantáneo de la máquina.
	 */
	restockMachineInstantPrize(
		raffleId: string,
		prizeId: string,
		amount: number,
	): Promise<boolean>;
}
