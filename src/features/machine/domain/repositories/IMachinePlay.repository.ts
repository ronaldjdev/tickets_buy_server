import type { MachinePlay } from "../entities/MachinePlay.entity.js";

export interface MachinePlayListQuery {
	raffleId?: string;
	documentNumber?: string;
	won?: boolean;
	delivered?: boolean;
	page?: number;
	limit?: number;
}

export interface MachinePlayListResult {
	plays: MachinePlay[];
	total: number;
}

export interface IMachinePlayRepository {
	save(play: MachinePlay): Promise<MachinePlay | null>;
	countByReference(reference: string): Promise<number>;
	byReference(reference: string, limit?: number): Promise<MachinePlay[]>;
	countByDocumentRaffle(
		documentNumber: string,
		raffleId: string,
	): Promise<number>;
	byDocumentRaffle(
		documentNumber: string,
		raffleId: string,
		limit?: number,
	): Promise<MachinePlay[]>;
	findById(id: string): Promise<MachinePlay | null>;
	updateDelivered(id: string, delivered: boolean): Promise<MachinePlay | null>;
	list(query: MachinePlayListQuery): Promise<MachinePlayListResult>;
}
