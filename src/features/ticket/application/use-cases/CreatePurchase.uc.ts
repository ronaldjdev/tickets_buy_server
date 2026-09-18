import { randomUUID } from "node:crypto";
import type { IGatewayLinkCreator } from "../../../../shared/contracts/IGatewayLinkCreator.contract.js";
import type {
	IRaffleService,
	RafflePayload,
} from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import { pickConsecutiveFreeNumbers } from "../../../../shared/utils/pickConsecutiveFreeNumbers.js";
import { pickRandomFreeNumbers } from "../../../../shared/utils/pickRandomFreeNumbers.js";
import type { Combo } from "../../../combo/domain/entities/Combo.entity.js";
import type { IComboRepository } from "../../../combo/domain/repositories/ICombo.repository.js";
import type { Contact } from "../../../contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "../../../contact/domain/repositories/IContact.repository.js";
import type { TicketIssuanceMode } from "../../../raffle/domain/entities/Raffle.entity.js";
import type {
	Ticket,
	TicketStatus,
} from "../../domain/entities/Ticket.entity.js";
import { ASSIGNED_TICKET_STATUSES } from "../../domain/entities/Ticket.entity.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "../../domain/errors/Ticket.error.js";
import type {
	ITicketRepository,
	ReserveTicketsData,
} from "../../domain/repositories/ITicket.repository.js";

export const RESERVATION_TTL_MINUTES = 15;
const MAX_RESERVATION_ATTEMPTS = 10;
const ASSIGNED_STATUSES: TicketStatus[] = [...ASSIGNED_TICKET_STATUSES];

export interface CreatePurchaseCommand {
	comboId?: string;
	raffleId?: string;
	quantity?: number;
	buyerName: string;
	buyerLastName: string;
	buyerEmail: string;
	buyerPhone: string;
	buyerDocumentType: Ticket["buyerDocumentType"];
	buyerDocumentNumber: string;
	buyerCountry: string;
	buyerAddress: string;
}

export interface CreatePurchaseResult {
	reference: string;
	checkoutUrl: string;
	amount: number;
	quantity: number;
	comboId?: string;
	comboName?: string;
	ticketIds: string[];
	ticketNumbers: number[];
}

export class CreatePurchase {
	constructor(
		private readonly raffleService: IRaffleService,
		private readonly ticketRepository: ITicketRepository,
		private readonly linkCreator: IGatewayLinkCreator,
		private readonly contactRepository: IContactRepository,
		private readonly comboRepository: IComboRepository,
		private readonly logger: ILogger,
	) {}

	async execute(command: CreatePurchaseCommand): Promise<CreatePurchaseResult> {
		if (
			!command.buyerName?.trim() ||
			!command.buyerLastName?.trim() ||
			!command.buyerEmail?.trim() ||
			!command.buyerPhone?.trim() ||
			!command.buyerDocumentType ||
			!command.buyerDocumentNumber?.trim() ||
			!command.buyerCountry?.trim() ||
			!command.buyerAddress?.trim()
		) {
			throw new UseCaseError(
				"Todos los datos del comprador son obligatorios: nombre, apellidos, identificación, teléfono, email, país y dirección.",
			);
		}

		const hasCombo = Boolean(command.comboId?.trim());
		const hasQuantity = command.quantity !== undefined;
		if (!hasCombo && !hasQuantity) {
			throw new UseCaseError(
				"Debes indicar un combo o una cantidad de boletos.",
			);
		}
		if (hasCombo && hasQuantity) {
			throw new UseCaseError(
				"Indica un combo o una cantidad personalizada, no ambos.",
			);
		}

		let raffle: RafflePayload | null;
		let quantity: number;
		let amount: number;
		let combo: Combo | null = null;

		if (hasCombo) {
			combo = await this.comboRepository.findById(command.comboId!.trim());
			if (!combo) throw new UseCaseError("El combo seleccionado no existe.");
			raffle = await this.raffleService.findById(combo.raffleId);
			quantity = combo.ticketCount;
			amount = combo.price;
		} else {
			if (!command.raffleId?.trim()) {
				throw new UseCaseError("La sorteo es obligatoria.");
			}
			raffle = await this.raffleService.findById(command.raffleId.trim());
			quantity = command.quantity!;
			amount = raffle ? raffle.ticketPrice * quantity : 0;
		}

		if (!raffle) {
			throw new RaffleNotFoundError(
				hasCombo ? combo!.raffleId : command.raffleId!,
			);
		}
		if (raffle.status !== "active") throw new RaffleNotActiveError(raffle.id);

		if (!Number.isInteger(quantity) || quantity < 1) {
			throw new UseCaseError(
				"La cantidad de boletos debe ser un número entero mayor a 0.",
			);
		}
		const minTickets = raffle.minTickets ?? 1;
		if (quantity < minTickets) {
			throw new UseCaseError(
				`El mínimo de boletos por compra es ${minTickets}.`,
			);
		}
		if (quantity > raffle.maxTickets) {
			throw new UseCaseError(
				`No puedes comprar más de ${raffle.maxTickets} boletos en este sorteo.`,
			);
		}
		if (!Number.isFinite(amount) || amount < 0) {
			throw new UseCaseError("No se pudo calcular el valor de la compra.");
		}

		await this.ticketRepository.releaseExpiredReserved(new Date());

		const purchaseId = randomUUID();
		const reservedUntil = new Date(
			Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000,
		);
		const protectedNumbers = new Set(
			(raffle.prizes ?? [])
				.map((p) => p.winningNumber)
				.filter((n): n is number => n !== undefined),
		);

		const claimed = await this.reserveTickets(
			raffle.id,
			raffle.maxTickets,
			quantity,
			raffle.ticketIssuance ?? "random",
			protectedNumbers,
			{
				purchaseId,
				reservedUntil,
				buyerName: command.buyerName,
				buyerLastName: command.buyerLastName,
				buyerEmail: command.buyerEmail,
				buyerPhone: command.buyerPhone,
				buyerDocumentType: command.buyerDocumentType,
				buyerDocumentNumber: command.buyerDocumentNumber?.trim(),
				buyerCountry: command.buyerCountry,
				buyerAddress: command.buyerAddress,
			},
		);

		const contact = await this.registerBuyer(command);

		const link = await this.linkCreator.execute({
			purchaseId,
			ticketIds: claimed.map((t) => t.id),
			contactId: this.contactId(contact),
			contactName: command.buyerName,
			contactPhone: command.buyerPhone,
			amountInCents: Math.round(amount * 100),
			expiresInMinutes: RESERVATION_TTL_MINUTES,
		});

		this.logger.info("Compra iniciada", {
			operation: "ticket.create_purchase",
			reference: link.reference,
			comboId: combo?.id,
			comboName: combo?.name,
			quantity,
			amount,
			ticketNumbers: claimed.map((t) => t.number).sort((a, b) => a - b),
			buyerName: command.buyerName,
			buyerEmail: command.buyerEmail,
		});

		return {
			reference: link.reference,
			checkoutUrl: link.checkoutUrl,
			amount,
			quantity,
			comboId: combo?.id,
			comboName: combo?.name,
			ticketIds: claimed.map((t) => t.id),
			ticketNumbers: claimed.map((t) => t.number).sort((a, b) => a - b),
		};
	}

	private async reserveTickets(
		raffleId: string,
		maxNumber: number,
		quantity: number,
		mode: TicketIssuanceMode,
		protectedNumbers: ReadonlySet<number>,
		data: ReserveTicketsData,
	): Promise<Ticket[]> {
		let claimed: Ticket[] = [];
		let attempts = 0;

		while (claimed.length < quantity && attempts < MAX_RESERVATION_ATTEMPTS) {
			attempts += 1;
			if (attempts > 1)
				await this.ticketRepository.releaseExpiredReserved(new Date());

			const assigned = await this.ticketRepository.countByRaffle(
				raffleId,
				ASSIGNED_STATUSES,
			);
			const freeSlots =
				maxNumber - assigned - protectedNumbers.size;
			if (freeSlots <= 0) break;

			const needed = Math.min(quantity - claimed.length, freeSlots);
			const existingNumbers = new Set(
				await this.ticketRepository.findNumbersByRaffle(raffleId),
			);
			const numbers = this.pickNumbers(
				existingNumbers,
				maxNumber,
				needed,
				mode,
				protectedNumbers,
			);
			if (numbers.length === 0) break;

			await this.ticketRepository.saveMany(
				numbers.map((number) => ({
					id: randomUUID(),
					raffleId,
					number,
					status: "reserved" as const,
					purchaseId: data.purchaseId,
					reservedUntil: data.reservedUntil,
					buyerName: data.buyerName,
					buyerLastName: data.buyerLastName,
					buyerEmail: data.buyerEmail,
					buyerPhone: data.buyerPhone,
					buyerDocumentType: data.buyerDocumentType,
					buyerDocumentNumber: data.buyerDocumentNumber,
					buyerCountry: data.buyerCountry,
					buyerAddress: data.buyerAddress,
				})),
			);
			claimed = await this.ticketRepository.findByPurchaseId(data.purchaseId);
		}

		if (claimed.length < quantity) throw new RaffleSoldOutError(raffleId);
		return claimed;
	}

	private pickNumbers(
		existing: ReadonlySet<number>,
		maxNumber: number,
		count: number,
		mode?: TicketIssuanceMode,
		excluded: ReadonlySet<number> = new Set(),
	): number[] {
		if (mode === "consecutive") {
			return pickConsecutiveFreeNumbers(existing, maxNumber, count, excluded);
		}
		return pickRandomFreeNumbers(existing, maxNumber, count, excluded);
	}

	private async registerBuyer(
		command: CreatePurchaseCommand,
	): Promise<Contact> {
		const contact = await this.contactRepository.create({
			name: command.buyerName.trim(),
			lastName: command.buyerLastName.trim(),
			email: command.buyerEmail.trim(),
			phone: command.buyerPhone.trim(),
			documentType: command.buyerDocumentType,
			documentNumber: command.buyerDocumentNumber.trim(),
			country: command.buyerCountry.trim(),
			address: command.buyerAddress.trim(),
			status: "activo",
		});
		if (!contact) throw new UseCaseError("No se pudo registrar al comprador.");
		return contact;
	}

	private contactId(contact: Contact): string | undefined {
		const withId = contact as unknown as { _id?: { toString(): string } };
		return withId._id?.toString();
	}
}
