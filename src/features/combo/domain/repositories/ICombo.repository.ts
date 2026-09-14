import type { Combo } from "../entities/Combo.entity.js";

export interface IComboRepository {
	save(combo: Combo): Promise<Combo | null>;
	findById(id: string): Promise<Combo | null>;
	byRaffle(raffleId: string): Promise<Combo[]>;
	list(): Promise<Combo[]>;
	update(id: string, data: Partial<Combo>): Promise<Combo | null>;
	delete(id: string): Promise<boolean>;
	clearRecommended(raffleId: string, exceptId: string): Promise<void>;
}
