import type { MachinePlay } from "../../domain/entities/MachinePlay.entity.js";
import type {
	IMachinePlayRepository,
	MachinePlayListQuery,
} from "../../domain/repositories/IMachinePlay.repository.js";

export interface ListMachinePlaysResult {
	plays: MachinePlay[];
	total: number;
	page: number;
	limit: number;
}

export class ListMachinePlays {
	constructor(private readonly machinePlayRepository: IMachinePlayRepository) {}

	async execute(query: MachinePlayListQuery): Promise<ListMachinePlaysResult> {
		const page = Math.max(1, query.page ?? 1);
		const limit = Math.min(100, Math.max(1, query.limit ?? 20));
		const { plays, total } = await this.machinePlayRepository.list({
			...query,
			page,
			limit,
		});
		return { plays, total, page, limit };
	}
}
