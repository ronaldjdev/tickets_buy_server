import type { MachineGrant } from "../../domain/entities/MachineGrant.entity.js";
import type { IMachineGrantRepository } from "../../domain/repositories/IMachineGrant.repository.js";

export interface ListMachineGrantsQuery {
	documentNumber?: string;
	raffleId?: string;
	limit?: number;
}

export class ListMachineGrants {
	constructor(private readonly grantRepository: IMachineGrantRepository) {}

	async execute(query: ListMachineGrantsQuery): Promise<MachineGrant[]> {
		return this.grantRepository.list({
			documentNumber: query.documentNumber?.trim() || undefined,
			raffleId: query.raffleId?.trim() || undefined,
			limit: query.limit,
		});
	}
}
