import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	IRaffleService,
	RafflePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";
import { BuyTickets } from "../application/use-cases/BuyTickets.uc.js";
import { ListTickets } from "../application/use-cases/ListTickets.uc.js";
import { ManageAvailability } from "../application/use-cases/ManageAvailability.uc.js";
import type { Ticket } from "../domain/entities/Ticket.entity.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
	TicketNotFoundError,
} from "../domain/errors/Ticket.error.js";
import type { ITicketRepository } from "../domain/repositories/ITicket.repository.js";

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

	async findByRaffle(raffleId: string): Promise<Ticket[]> {
		return this.store.filter((t) => t.raffleId === raffleId);
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
		const useCase = new BuyTickets(raffleService, repo);

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
		const useCase = new BuyTickets(raffleService, repo);

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
		const useCase = new BuyTickets(raffleService, repo);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1", quantity: 1 }),
			RaffleNotActiveError,
		);
	});

	it("debería fallar si no hay suficientes tickets", async () => {
		const raffleService = new MockRaffleService(makeRaffle());
		const repo = new MockTicketRepository(makeTickets(1, 1));
		const useCase = new BuyTickets(raffleService, repo);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1", quantity: 2 }),
			RaffleSoldOutError,
		);
	});
});

describe("ListTickets", () => {
	it("debería listar tickets de una raffle", async () => {
		const repo = new MockTicketRepository(makeTickets(3, 0));
		const useCase = new ListTickets(repo);

		const tickets = await useCase.execute({ raffleId: "raffle-1" });
		assert.equal(tickets.length, 3);
	});
});

describe("ManageAvailability", () => {
	it("debería liberar un ticket comprado", async () => {
		const repo = new MockTicketRepository(makeTickets(2, 1));
		const useCase = new ManageAvailability(repo);

		const ticket = await useCase.execute({ ticketId: "t1", action: "release" });
		assert.equal(ticket.status, "available");
	});

	it("debería fallar si el ticket no existe", async () => {
		const repo = new MockTicketRepository(makeTickets(2, 0));
		const useCase = new ManageAvailability(repo);

		await assert.rejects(
			() => useCase.execute({ ticketId: "no-existe", action: "release" }),
			TicketNotFoundError,
		);
	});
});
