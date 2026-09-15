import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { OptionsPag } from "../../../../shared/types/types.js";
import type {
	IListUsersResponse,
	IUserRepository,
} from "../../domain/repositories/IUser.repository.js";

export class ListUsers {
	constructor(private userRepo: IUserRepository) {}
	async execute(options: OptionsPag): Promise<IListUsersResponse> {
		if (options.limit <= 0)
			throw new UseCaseError("El límite debe ser un número positivo.");
		if (options.limit > 100)
			throw new UseCaseError("El límite no puede ser mayor a 100.");
		if (options.page <= 0)
			throw new UseCaseError("La página debe ser un número positivo.");

		const { users, paginate } = await this.userRepo.list(options);
		return { users, paginate };
	}
}
