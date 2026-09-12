import { randomUUID } from "node:crypto";
import type { IComboRepository } from "@/features/combo/domain/repositories/ICombo.repository.js";
import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "@/features/contact/domain/repositories/IContact.repository.js";
import type { Ticket } from "@/features/ticket/domain/entities/Ticket.entity.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "@/features/ticket/domain/errors/Ticket.error.js";
import type {
	ITicketRepository,
	ReserveTicketsData,
} from "@/features/ticket/domain/repositories/ITicket.repository.js";
import type { IGatewayLinkCreator } from "@/shared/contracts/IGatewayLinkCreator.contract.js";
import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";

export const RESERVATION_TTL_MINUTES = 15;
const MAX_RESERVATION_ATTEMPTS = 10;

export interface CreatePurchaseCommand {
	comboId: string;
	buyerName: string;
	buyerEmail: string;
	buyerPhone?: string;
}

export interface CreatePurchaseResult {
	reference: string;
	checkoutUrl: string;
	amount: number;
	quantity: number;
	comboId: string;
	comboName: string;
	ticketIds: string[];
	ticketNumbers: number[];
}

function randomSample<T>(items: T[], count: number): T[] {
	const pool = [...items];
	const sample: T[] = [];
	while (sample.length < count && pool.length > 0) {
		const index = Math.floor(Math.random() * pool.length);
		sample.push(pool.splice(index, 1)[0]);
	}
	return sample;
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
		if (!command?.comboId?.trim())
			throw new UseCaseError("El combo es obligatorio.");
		if (!command.buyerName?.trim() || !command.buyerEmail?.trim()) {
			throw new UseCaseError(
				"El nombre y el correo del comprador son obligatorios.",
			);
		}

		const combo = await this.comboRepository.findById(command.comboId);
		if (!combo) throw new UseCaseError("El combo seleccionado no existe.");

		const raffle = await this.raffleService.findById(combo.raffleId);
		if (!raffle) throw new RaffleNotFoundError(combo.raffleId);
		if (raffle.status !== "active")
			throw new RaffleNotActiveError(combo.raffleId);

		await this.ticketRepository.releaseExpiredReserved(new Date());

		const purchaseId = randomUUID();
		const reservedUntil = new Date(
			Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000,
		);

		const claimed = await this.reserveRandomTickets(
			raffle.id,
			raffle.maxTickets,
			combo.ticketCount,
			{
				purchaseId,
				reservedUntil,
				buyerName: command.buyerName,
				buyerEmail: command.buyerEmail,
				buyerPhone: command.buyerPhone,
			},
		);

		const contact = await this.registerBuyer(command);

		const link = await this.linkCreator.execute({
			purchaseId,
			ticketIds: claimed.map((t) => t.id),
			contactId: this.contactId(contact),
			contactName: command.buyerName,
			contactPhone: command.buyerPhone,
			amountInCents: Math.round(combo.price * 100),
			expiresInMinutes: RESERVATION_TTL_MINUTES,
		});

		this.logger.info("Compra iniciada", {
			operation: "ticket.create_purchase",
			reference: link.reference,
			comboId: combo.id,
			comboName: combo.name,
			quantity: combo.ticketCount,
			amount: combo.price,
			ticketNumbers: claimed.map((t) => t.number).sort((a, b) => a - b),
			buyerName: command.buyerName,
			buyerEmail: command.buyerEmail,
		});

		return {
			reference: link.reference,
			checkoutUrl: link.checkoutUrl,
			amount: combo.price,
			quantity: combo.ticketCount,
			comboId: combo.id,
			comboName: combo.name,
			ticketIds: claimed.map((t) => t.id),
			ticketNumbers: claimed.map((t) => t.number).sort((a, b) => a - b),
		};
	}

	private async reserveRandomTickets(
		raffleId: string,
		maxNumber: number,
		quantity: number,
		data: ReserveTicketsData,
	): Promise<Ticket[]> {
		let claimed: Ticket[] = [];
		let attempts = 0;

		while (claimed.length < quantity && attempts < MAX_RESERVATION_ATTEMPTS) {
			attempts += 1;
			const tickets = await this.ticketRepository.findByRaffle(raffleId);
			const available = tickets.filter(
				(t) => t.status === "available" && t.number <= maxNumber,
			);
			if (available.length === 0) break;

			const sample = randomSample(
				available,
				Math.min(quantity - claimed.length, available.length),
			);
			if (sample.length === 0) break;

			await this.ticketRepository.reserveTickets(
				sample.map((t) => t.id),
				data,
			);
			claimed = await this.ticketRepository.findByPurchaseId(data.purchaseId);
		}

		if (claimed.length < quantity) throw new RaffleSoldOutError(raffleId);
		return claimed;
	}

	private async registerBuyer(
		command: CreatePurchaseCommand,
	): Promise<Contact> {
		const contact = await this.contactRepository.create({
			name: command.buyerName.trim(),
			email: command.buyerEmail.trim(),
			phone: (command.buyerPhone ?? "").trim() || command.buyerEmail.trim(),
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
