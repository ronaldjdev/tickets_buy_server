import type { MachineGrant } from "../entities/MachineGrant.entity.js";

export interface MachineGrantListQuery {
	documentNumber?: string;
	raffleId?: string;
	limit?: number;
}

export interface IMachineGrantRepository {
	save(grant: MachineGrant): Promise<MachineGrant>;
	byDocumentRaffle(
		documentNumber: string,
		raffleId: string,
	): Promise<MachineGrant[]>;
	list(query: MachineGrantListQuery): Promise<MachineGrant[]>;
}
