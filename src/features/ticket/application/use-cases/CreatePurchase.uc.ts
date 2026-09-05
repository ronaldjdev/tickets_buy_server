import { randomUUID } from "node:crypto";
import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "@/features/contact/domain/repositories/IContact.repository.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "@/features/ticket/domain/errors/Ticket.error.js";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository.js";
import type { IGatewayLinkCreator } from "@/shared/contracts/IGatewayLinkCreator.contract.js";
import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export const RESERVATION_TTL_MINUTES = 15;

export interface CreatePurchaseCommand {
	raffleId: string;
	quantity: number;
	buyerName: string;
	buyerEmail: string;
	buyerPhone?: string;
}

export interface CreatePurchaseResult {
	reference: string;
	checkoutUrl: string;
	amount: number;
	quantity: number;
	ticketIds: string[];
}

export class CreatePurchase {
	constructor(
		private readonly raffleService: IRaffleService,
		private readonly ticketRepository: ITicketRepository,
		private readonly linkCreator: IGatewayLinkCreator,
		private readonly contactRepository: IContactRepository,
	) {}

	async execute(command: CreatePurchaseCommand): Promise<CreatePurchaseResult> {
		if (!Number.isInteger(command.quantity) || command.quantity <= 0) {
			throw new UseCaseError(
				"La cantidad de boletos debe ser un número positivo.",
			);
		}
		if (!command.buyerName?.trim() || !command.buyerEmail?.trim()) {
			throw new UseCaseError(
				"El nombre y el correo del comprador son obligatorios.",
			);
		}

		const raffle = await this.raffleService.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		if (raffle.status !== "active")
			throw new RaffleNotActiveError(command.raffleId);

		await this.ticketRepository.releaseExpiredReserved(new Date());

		const tickets = await this.ticketRepository.findByRaffle(command.raffleId);
		const available = tickets.filter((t) => t.status === "available");
		if (available.length < command.quantity)
			throw new RaffleSoldOutError(command.raffleId);

		const toReserve = available.slice(0, command.quantity);
		const purchaseId = randomUUID();
		const reservedUntil = new Date(
			Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000,
		);

		const contact = await this.registerBuyer(command);

		await this.ticketRepository.reserveTickets(
			toReserve.map((t) => t.id),
			{
				purchaseId,
				reservedUntil,
				buyerName: command.buyerName,
				buyerEmail: command.buyerEmail,
				buyerPhone: command.buyerPhone,
			},
		);

		const amount = raffle.ticketPrice * command.quantity;
		const link = await this.linkCreator.execute({
			purchaseId,
			ticketIds: toReserve.map((t) => t.id),
			contactId: this.contactId(contact),
			contactName: command.buyerName,
			contactPhone: command.buyerPhone,
			amountInCents: Math.round(amount * 100),
			expiresInMinutes: RESERVATION_TTL_MINUTES,
		});

		return {
			reference: link.reference,
			checkoutUrl: link.checkoutUrl,
			amount,
			quantity: command.quantity,
			ticketIds: toReserve.map((t) => t.id),
		};
	}

	private async registerBuyer(
		command: CreatePurchaseCommand,
	): Promise<Contact> {
		const contact = await this.contactRepository.create({
			name: command.buyerName.trim(),
			email: command.buyerEmail.trim(),
			phone: (command.buyerPhone ?? "").trim() || command.buyerEmail.trim(),
			status: "activo",
			accountStatus: "al_dia",
			totalDebt: 0,
		});
		if (!contact) throw new UseCaseError("No se pudo registrar al comprador.");
		return contact;
	}

	private contactId(contact: Contact): string | undefined {
		const withId = contact as unknown as { _id?: { toString(): string } };
		return withId._id?.toString();
	}
}
