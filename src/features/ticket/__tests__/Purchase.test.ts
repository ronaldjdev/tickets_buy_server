import assert from "node:assert";
import { describe, it } from "node:test";
import type { Contact } from "../../../features/contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "../../../features/contact/domain/repositories/IContact.repository.js";
import type {
	GatewayLinkRequest,
	GatewayLinkResult,
	IGatewayLinkCreator,
} from "../../../shared/contracts/IGatewayLinkCreator.contract.js";
import type {
	IRaffleService,
	RafflePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";

import { ConfirmTicketPayment } from "../application/use-cases/ConfirmTicketPayment.uc.js";
import {
	CreatePurchase,
	RESERVATION_TTL_MINUTES,
} from "../application/use-cases/CreatePurchase.uc.js";
import type { Ticket } from "../domain/entities/Ticket.entity.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "../domain/errors/Ticket.error.js";
import type { ITicketRepository } from "../domain/repositories/ITicket.repository.js";

class MockRaffleService implements IRaffleService {
	constructor(raffle: RafflePayload | null) {
		this.raffle = raffle;
	}
	raffle: RafflePayload | null;
	async findById(): Promise<RafflePayload | null> {
		return this.raffle;
	}
}

class MockContactRepo implements IContactRepository {
	created: Contact[] = [];

	async create(data: Contact): Promise<Contact> {
		const contact = { ...data, _id: { toString: () => "contact-1" } };
		this.created.push(contact as unknown as Contact);
		return contact as unknown as Contact;
	}

	async findById(): Promise<Contact | null> {
		return null;
	}

	async findByPhone(): Promise<Contact | null> {
		return null;
	}

	async list() {
		return {
			contacts: [],
			paginate: {
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 0,
				hasNextPage: false,
				hasPrevPage: false,
			},
		};
	}

	async update(): Promise<Contact | null> {
		return null;
	}

	async delete() {
		return Promise.resolve();
	}

	async countAll(): Promise<number> {
		return 0;
	}

	async countNewThisMonth(): Promise<number> {
		return 0;
	}

	async topDebtors(): Promise<never[]> {
		return [];
	}
}

class MockLinkCreator implements IGatewayLinkCreator {
	inputs: GatewayLinkRequest[] = [];

	async execute(input: GatewayLinkRequest): Promise<GatewayLinkResult> {
		this.inputs.push(input);
		return {
			reference: `${input.purchaseId}-abc123`,
			checkoutUrl: "https://checkout.wompi.co/l/link-1",
			amountInCents: input.amountInCents,
			purchaseId: input.purchaseId,
		};
	}
}

class MockTicketRepo implements ITicketRepository {
	store: Ticket[];

	constructor(tickets: Ticket[]) {
		this.store = tickets.map((t) => ({ ...t }));
	}

	async findById(id: string): Promise<Ticket | null> {
		return this.store.find((t) => t.id === id) || null;
	}

	async findByRaffle(raffleId: string): Promise<Ticket[]> {
		return this.store.filter((t) => t.raffleId === raffleId);
	}

	async findByPurchaseId(purchaseId: string): Promise<Ticket[]> {
		return this.store.filter((t) => t.purchaseId === purchaseId);
	}

	async findWinningTicket(): Promise<Ticket | null> {
		return null;
	}

	async save(ticket: Ticket): Promise<Ticket> {
		this.store = this.store.map((t) => (t.id === ticket.id ? ticket : t));
		return ticket;
	}

	async saveMany(tickets: Ticket[]): Promise<Ticket[]> {
		this.store.push(...tickets);
		return tickets;
	}

	async reserveTickets(
		ticketIds: string[],
		data: Parameters<ITicketRepository["reserveTickets"]>[1],
	): Promise<void> {
		this.store = this.store.map((t) =>
			ticketIds.includes(t.id) && t.status === "available"
				? {
						...t,
						status: "reserved" as const,
						buyerName: data.buyerName,
						buyerEmail: data.buyerEmail,
						buyerPhone: data.buyerPhone,
						purchaseId: data.purchaseId,
						reservedUntil: data.reservedUntil,
					}
				: t,
		);
	}

	async markPurchasedByPurchaseId(purchaseId: string): Promise<number> {
		let count = 0;
		this.store = this.store.map((t) => {
			if (t.purchaseId === purchaseId && t.status === "reserved") {
				count++;
				return { ...t, status: "purchased" as const, reservedUntil: null };
			}
			return t;
		});
		return count;
	}

	async releaseExpiredReserved(until: Date): Promise<number> {
		let count = 0;
		this.store = this.store.map((t) => {
			if (
				t.status === "reserved" &&
				t.reservedUntil &&
				t.reservedUntil <= until
			) {
				count++;
				return {
					...t,
					status: "available" as const,
					purchaseId: undefined,
					reservedUntil: null,
				};
			}
			return t;
		});
		return count;
	}
}

function makeRaffle(): RafflePayload {
	return {
		id: "raffle-1",
		title: "Sorteo",
		status: "active",
		ticketPrice: 10000,
		maxTickets: 10,
	};
}

function makeTickets(count: number, reserved: number = 0): Ticket[] {
	const tickets: Ticket[] = [];
	for (let i = 0; i < count; i++) {
		tickets.push({
			id: `t${i + 1}`,
			raffleId: "raffle-1",
			number: i + 1,
			status: i < reserved ? "reserved" : "available",
		});
	}
	return tickets;
}

function makeCommand(overrides: Record<string, unknown> = {}) {
	return {
		raffleId: "raffle-1",
		quantity: 2,
		buyerName: "Ana Pérez",
		buyerEmail: "ana@mail.com",
		buyerPhone: "3001234567",
		...overrides,
	};
}

function build() {
	const raffleService = new MockRaffleService(makeRaffle());
	const ticketRepo = new MockTicketRepo(makeTickets(5));
	const linkCreator = new MockLinkCreator();
	const contactRepo = new MockContactRepo();
	const useCase = new CreatePurchase(
		raffleService,
		ticketRepo,
		linkCreator,
		contactRepo,
	);
	return { useCase, raffleService, ticketRepo, linkCreator, contactRepo };
}

describe("CreatePurchase", () => {
	it("debería reservar tickets y devolver el link de pago", async () => {
		const { useCase, ticketRepo, linkCreator, contactRepo } = build();

		const result = await useCase.execute(makeCommand());

		assert.equal(result.quantity, 2);
		assert.equal(result.amount, 20000);
		assert.ok(result.checkoutUrl);
		assert.equal(
			ticketRepo.store.filter((t) => t.status === "reserved").length,
			2,
		);
		assert.equal(linkCreator.inputs.length, 1);
		assert.equal(linkCreator.inputs[0].amountInCents, 2000000);
		assert.equal(
			linkCreator.inputs[0].expiresInMinutes,
			RESERVATION_TTL_MINUTES,
		);
		assert.equal(contactRepo.created[0].email, "ana@mail.com");
	});

	it("debería fallar si la rifa no está activa", async () => {
		const { useCase, raffleService } = build();
		raffleService.raffle = { ...makeRaffle(), status: "draft" };

		await assert.rejects(
			() => useCase.execute(makeCommand()),
			RaffleNotActiveError,
		);
	});

	it("debería fallar si la rifa no existe", async () => {
		const { useCase, raffleService } = build();
		raffleService.raffle = null;

		await assert.rejects(
			() => useCase.execute(makeCommand()),
			RaffleNotFoundError,
		);
	});

	it("debería fallar si no hay boletos disponibles", async () => {
		const { useCase, ticketRepo } = build();
		ticketRepo.store = makeTickets(2, 2);

		await assert.rejects(
			() => useCase.execute(makeCommand()),
			RaffleSoldOutError,
		);
	});

	it("debería liberar reservas expiradas antes de reservar", async () => {
		const { useCase, ticketRepo } = build();
		const expired = makeTickets(4);
		expired[0] = {
			...expired[0],
			status: "reserved",
			purchaseId: "old",
			reservedUntil: new Date(Date.now() - 60_000),
		};
		ticketRepo.store = expired;

		const result = await useCase.execute(makeCommand());
		assert.ok(result.reference);
		assert.equal(
			ticketRepo.store.filter((t) => t.status === "available").length,
			2,
		);
	});
});

describe("ConfirmTicketPayment", () => {
	it("debería marcar los tickets reservados como comprados", async () => {
		const repo = new MockTicketRepo(makeTickets(3));
		const confirm = new ConfirmTicketPayment(repo);

		const reserved = await repo.reserveTickets(["t1", "t2"], {
			purchaseId: "purchase-1",
			reservedUntil: new Date(Date.now() + 60_000),
			buyerName: "Ana",
			buyerEmail: "ana@mail.com",
		});
		assert.equal(reserved, undefined);

		const result = await confirm.execute({
			purchaseId: "purchase-1",
			amount: 20000,
			method: "nequi",
			status: "confirmado",
			paymentDate: new Date().toISOString(),
			paymentId: "wompi_txn-1",
			gateway: "wompi",
		});

		assert.equal(result.ticketCount, 2);
		assert.equal(repo.store.filter((t) => t.status === "purchased").length, 2);
	});
});
