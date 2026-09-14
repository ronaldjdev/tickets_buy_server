import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	IRaffleService,
	RafflePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { BuyTickets } from "../application/use-cases/BuyTickets.uc.js";
import { ListTickets } from "../application/use-cases/ListTickets.uc.js";
import { ManageAvailability } from "../application/use-cases/ManageAvailability.uc.js";
import type { Ticket, TicketStatus } from "../domain/entities/Ticket.entity.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
	TicketNotFoundError,
} from "../domain/errors/Ticket.error.js";
import type { ITicketRepository } from "../domain/repositories/ITicket.repository.js";

const noopLogger = createNoopLogger();

class MockRaffleService implements IRaffleService {
	raffle: RafflePayload | null;

	constructor(raffle: RafflePayload | null) {
		this.raffle = raffle;
	}

	async findById(): Promise<RafflePayload | null> {
		return this.raffle;
	}
}

class MockTicketRepository implements ITicketRepository {
	store: Ticket[];

	constructor(tickets: Ticket[]) {
		this.store = tickets.map((t) => ({ ...t }));
	}

	async findById(id: string): Promise<Ticket | null> {
		return this.store.find((t) => t.id === id) || null;
	}

	async findByIds(ids: string[]): Promise<Ticket[]> {
		return this.store.filter((t) => ids.includes(t.id));
	}

	async findByRaffle(
		raffleId: string,
		statuses?: TicketStatus[],
	): Promise<Ticket[]> {
		return this.store.filter(
			(t) =>
				t.raffleId === raffleId &&
				(!statuses || statuses.length === 0 || statuses.includes(t.status)),
		);
	}

	async countByRaffle(
		raffleId: string,
		statuses: TicketStatus[],
	): Promise<number> {
		return this.store.filter(
			(t) => t.raffleId === raffleId && statuses.includes(t.status),
		).length;
	}

	async findNumbersByRaffle(raffleId: string): Promise<number[]> {
		return [
			...new Set(
				this.store.filter((t) => t.raffleId === raffleId).map((t) => t.number),
			),
		];
	}

	async findWinningTicket(raffleId: string): Promise<Ticket | null> {
		return (
			this.store.find(
				(t) => t.raffleId === raffleId && t.status === "winner",
			) || null
		);
	}

	async save(ticket: Ticket): Promise<Ticket> {
		this.store = this.store.map((t) => (t.id === ticket.id ? ticket : t));
		return ticket;
	}

	async saveMany(tickets: Ticket[]): Promise<Ticket[]> {
		this.store.push(...tickets);
		return tickets;
	}

	async findByPurchaseId(purchaseId: string): Promise<Ticket[]> {
		return this.store.filter((t) => t.purchaseId === purchaseId);
	}

	async findByDocumentNumber(
		documentNumber: string,
		statuses?: TicketStatus[],
	): Promise<Ticket[]> {
		return this.store.filter(
			(t) =>
				t.buyerDocumentNumber === documentNumber &&
				(!statuses || statuses.length === 0 || statuses.includes(t.status)),
		);
	}

	async reserveTickets(
		ticketIds: string[],
		data: {
			buyerName?: string;
			buyerEmail?: string;
			buyerPhone?: string;
			buyerDocumentType?: Ticket["buyerDocumentType"];
			buyerDocumentNumber?: string;
			purchaseId: string;
			reservedUntil: Date;
		},
	): Promise<number> {
		let count = 0;
		this.store = this.store.map((t) =>
			ticketIds.includes(t.id) && t.status === "available"
				? (() => {
						count++;
						return {
							...t,
							status: "reserved" as const,
							buyerName: data.buyerName,
							buyerEmail: data.buyerEmail,
							buyerPhone: data.buyerPhone,
							buyerDocumentType: data.buyerDocumentType,
							buyerDocumentNumber: data.buyerDocumentNumber,
							purchaseId: data.purchaseId,
							reservedUntil: data.reservedUntil,
						};
					})()
				: t,
		);
		return count;
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
		const before = this.store.length;
		this.store = this.store.filter(
			(t) =>
				!(
					t.status === "reserved" &&
					t.reservedUntil &&
					t.reservedUntil <= until
				),
		);
		return before - this.store.length;
	}

	async deleteAvailableBeyond(
		raffleId: string,
		afterNumber: number,
	): Promise<number> {
		const before = this.store.length;
		this.store = this.store.filter(
			(t) =>
				!(
					t.raffleId === raffleId &&
					t.number > afterNumber &&
					t.status === "available"
				),
		);
		return before - this.store.length;
	}

	async deleteByRaffle(raffleId: string): Promise<number> {
		const before = this.store.length;
		this.store = this.store.filter((t) => t.raffleId !== raffleId);
		return before - this.store.length;
	}
}

function makeRaffle(): RafflePayload {
	return {
		id: "raffle-1",
		title: "Sorteo",
		status: "active",
		ticketPrice: 10,
		maxTickets: 10,
	};
}

function makeTickets(count: number, purchased: number): Ticket[] {
	const tickets: Ticket[] = [];
	for (let i = 0; i < count; i++) {
		tickets.push({
			id: `t${i + 1}`,
			raffleId: "raffle-1",
			number: i + 1,
			status: i < purchased ? "purchased" : "available",
		});
	}
	return tickets;
}

describe("BuyTickets", () => {
	it("debería comprar tickets disponibles", async () => {
		const raffleService = new MockRaffleService(makeRaffle());
		const repo = new MockTicketRepository(makeTickets(5, 0));
		const useCase = new BuyTickets(raffleService, repo, noopLogger);

		const purchased = await useCase.execute({
			raffleId: "raffle-1",
			quantity: 2,
			buyerName: "Ana",
			buyerEmail: "ana@mail.com",
		});

		assert.equal(purchased.length, 2);
		assert.equal(purchased[0].status, "purchased");
		assert.equal(purchased[0].buyerName, "Ana");
	});

	it("debería fallar si la raffle no existe", async () => {
		const raffleService = new MockRaffleService(null);
		const repo = new MockTicketRepository(makeTickets(5, 0));
		const useCase = new BuyTickets(raffleService, repo, noopLogger);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1", quantity: 1 }),
			RaffleNotFoundError,
		);
	});

	it("debería fallar si la raffle no está activa", async () => {
		const raffleService = new MockRaffleService({
			...makeRaffle(),
			status: "draft",
		});
		const repo = new MockTicketRepository(makeTickets(5, 0));
		const useCase = new BuyTickets(raffleService, repo, noopLogger);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1", quantity: 1 }),
			RaffleNotActiveError,
		);
	});

	it("debería fallar si no hay suficientes tickets", async () => {
		const raffleService = new MockRaffleService(makeRaffle());
		const repo = new MockTicketRepository(makeTickets(10, 10));
		const useCase = new BuyTickets(raffleService, repo, noopLogger);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1", quantity: 2 }),
			RaffleSoldOutError,
		);
	});
});

describe("ListTickets", () => {
	it("debería listar solo los vendidos por defecto", async () => {
		const repo = new MockTicketRepository([
			...makeTickets(3, 1),
			{ id: "t0", raffleId: "raffle-1", number: 4, status: "winner" },
			{
				id: "t9",
				raffleId: "raffle-1",
				number: 5,
				status: "reserved",
				buyerName: "Ana",
			},
		]);
		const useCase = new ListTickets(repo);

		const tickets = await useCase.execute({ raffleId: "raffle-1" });

		assert.equal(tickets.length, 2);
		assert.deepEqual(
			tickets.map((t) => t.status),
			["purchased", "winner"],
		);
	});

	it("debería listar todos los tickets con status all", async () => {
		const repo = new MockTicketRepository([
			...makeTickets(3, 0),
			{
				id: "t9",
				raffleId: "raffle-1",
				number: 4,
				status: "reserved",
				buyerName: "Ana",
			},
		]);
		const useCase = new ListTickets(repo);

		const tickets = await useCase.execute({
			raffleId: "raffle-1",
			status: "all",
		});

		assert.equal(tickets.length, 4);
	});

	it("debería listar por un status específico", async () => {
		const repo = new MockTicketRepository([
			...makeTickets(3, 0),
			{
				id: "t9",
				raffleId: "raffle-1",
				number: 4,
				status: "reserved",
				buyerName: "Ana",
			},
		]);
		const useCase = new ListTickets(repo);

		const tickets = await useCase.execute({
			raffleId: "raffle-1",
			status: "available",
		});

		assert.deepEqual(
			tickets.map((t) => t.status),
			["available", "available", "available"],
		);
	});
});

describe("ManageAvailability", () => {
	it("debería liberar un ticket comprado", async () => {
		const repo = new MockTicketRepository(makeTickets(2, 1));
		const useCase = new ManageAvailability(repo, noopLogger);

		const ticket = await useCase.execute({ ticketId: "t1", action: "release" });
		assert.equal(ticket.status, "available");
	});

	it("debería fallar si el ticket no existe", async () => {
		const repo = new MockTicketRepository(makeTickets(2, 0));
		const useCase = new ManageAvailability(repo, noopLogger);

		await assert.rejects(
			() => useCase.execute({ ticketId: "no-existe", action: "release" }),
			TicketNotFoundError,
		);
	});
});
