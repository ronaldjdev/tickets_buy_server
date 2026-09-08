import logger from "../../../../platform/logger/index.js";
import type { NotificationService } from "../../../notification/application/services/NotificationService.js";
import type {
	Raffle,
	RaffleStatus,
} from "../../domain/entities/Raffle.entity.js";
import { RaffleNotFoundError } from "../../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface ChangeRaffleStatusCommand {
	raffleId: string;
	status: RaffleStatus;
}

export class ChangeRaffleStatus {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly notificationService?: NotificationService,
	) {}

	async execute(command: ChangeRaffleStatusCommand): Promise<Raffle> {
		const raffle = await this.raffleRepository.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);

		if (raffle.status === "drawn") {
			throw new Error("El sorteo ya fue sorteado y no puede cambiar de estado");
		}
		if (command.status === "drawn") {
			throw new Error("El estado 'drawn' solo se asigna al sortear al ganador");
		}

		const updated = await this.raffleRepository.update({
			...raffle,
			status: command.status,
		});

		if (command.status === "active" && this.notificationService) {
			try {
				await this.notificationService.notifyUsers({
					type: "sale_active",
					title: "Sorteo activado",
					message: `El sorteo "${updated.title}" ya está activo y recibe ventas.`,
					metadata: { raffleId: updated.id },
				});
			} catch (error) {
				logger.warn("No se pudo emitir notificación de sorteo activo", {
					error,
				});
			}
		}

		return updated;
	}
}
