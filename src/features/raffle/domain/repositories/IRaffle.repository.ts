import type { Raffle } from "../entities/Raffle.entity.js";

export interface RaffleQuery {
	status?: Raffle["status"];
	limit?: number;
	offset?: number;
}

export interface IRaffleRepository {
	findById(id: string): Promise<Raffle | null>;
	list(query: RaffleQuery): Promise<Raffle[]>;
	save(raffle: Raffle): Promise<Raffle>;
	update(raffle: Raffle): Promise<Raffle>;
	delete(id: string): Promise<void>;
}
