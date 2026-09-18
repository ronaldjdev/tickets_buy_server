import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	ITicketService,
	TicketPayload,
} from "../../../shared/contracts/ticket/ITicketService.contract.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { DrawWinner } from "../application/use-cases/DrawWinner.uc.js";
import type { Raffle } from "../domain/entities/Raffle.entity.js";
import {
	NoTicketsPurchasedError,
	RaffleAlreadyDrawnError,
} from "../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../domain/repositories/IRaffle.repository.js";

const noopLogger = createNoopLogger();

function makeRaffle(partial: Partial<Raffle> = {}): Raffle {
	return {
		id: "raffle-1",
		slug: "sorteo",
		title: "Sorteo",
		prizes: [{ type: "mayor", name: "Premio" }],
		startDate: new Date(),
		endDate: new Date(),
		ticketPrice: 10,
		maxTickets: 10,
		status: "active",
		...partial,
	};
}

class MockRaffleRepository implements IRaffleRepository {
	raffle: Raffle | null;

	constructor(raffle: Raffle | null) {
		this.raffle = raffle;
	}

	async findById(): Promise<Raffle | null> {
		return this.raffle;
	}

	async findBySlug(slug: string): Promise<Raffle | null> {
		return this.raffle && this.raffle.slug === slug ? this.raffle : null;
	}

	async list(): Promise<Raffle[]> {
		return this.raffle ? [this.raffle] : [];
	}

	async save(entity: Raffle): Promise<Raffle> {
		this.raffle = entity;
		return entity;
	}

	async update(entity: Raffle): Promise<Raffle> {
		this.raffle = entity;
		return entity;
	}

	async delete(id: string): Promise<void> {
		if (this.raffle?.id === id) this.raffle = null;
	}

	async deactivateActiveRaffles(exceptRaffleId: string): Promise<void> {
		if (this.raffle?.status === "active" && this.raffle.id !== exceptRaffleId) {
			this.raffle = { ...this.raffle, status: "draft" };
		}
	}
}

class MockTicketService implements ITicketService {
	store: TicketPayload[];

	constructor(tickets: TicketPayload[]) {
		this.store = tickets.map((t) => ({ ...t }));
	}

	async listTickets(raffleId: string): Promise<TicketPayload[]> {
		return this.store.filter((t) => t.raffleId === raffleId);
	}

	async findByRaffle(raffleId: string): Promise<TicketPayload[]> {
		return this.listTickets(raffleId);
	}

	async markAsWinner(ticketId: string): Promise<TicketPayload> {
		let winner!: TicketPayload;
		this.store = this.store.map((t) => {
			if (t.id === ticketId) {
				winner = { ...t, status: "winner" };
				return winner;
			}
			return t;
		});
		return winner;
	}

	async createGuaranteedWinner(
		raffleId: string,
		number: number,
	): Promise<TicketPayload> {
		const ticket: TicketPayload = {
			id: `g-${number}`,
			raffleId,
			number,
			status: "guaranteed",
		};
		this.store.push(ticket);
		return ticket;
	}

	async countSoldTickets(raffleId: string): Promise<number> {
		return this.store.filter(
			(t) =>
				t.raffleId === raffleId &&
				(t.status === "purchased" || t.status === "winner"),
		).length;
	}

	async releaseAvailableBeyond(): Promise<number> {
		return 0;
	}

	async deleteByRaffle(raffleId: string): Promise<number> {
		const before = this.store.length;
		this.store = this.store.filter((t) => t.raffleId !== raffleId);
		return before - this.store.length;
	}
}

function makeTickets(count: number, purchased: number): TicketPayload[] {
	const tickets: TicketPayload[] = [];
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

describe("DrawWinner", () => {
	it("debería seleccionar un ganador entre los tickets comprados", async () => {
		const raffleRepo = new MockRaffleRepository(makeRaffle());
		const ticketService = new MockTicketService(makeTickets(5, 3));
		const useCase = new DrawWinner(
			raffleRepo,
			ticketService,
			undefined,
			noopLogger,
		);

		const drawn = await useCase.execute({ raffleId: "raffle-1" });
		assert.equal(drawn.status, "drawn");
		assert.ok(drawn.winnerTicketId);

		const winner = ticketService.store.find((t) => t.status === "winner");
		assert.ok(winner);
		assert.equal(winner.status, "winner");
		assert.equal(winner.id, drawn.winnerTicketId);
	});

	it("debería fallar si no hay tickets comprados", async () => {
		const raffleRepo = new MockRaffleRepository(makeRaffle());
		const ticketService = new MockTicketService(makeTickets(5, 0));
		const useCase = new DrawWinner(
			raffleRepo,
			ticketService,
			undefined,
			noopLogger,
		);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1" }),
			NoTicketsPurchasedError,
		);
	});

	it("debería fallar si la raffle ya fue sorteada", async () => {
		const raffleRepo = new MockRaffleRepository(
			makeRaffle({ status: "drawn" }),
		);
		const ticketService = new MockTicketService(makeTickets(5, 3));
		const useCase = new DrawWinner(
			raffleRepo,
			ticketService,
			undefined,
			noopLogger,
		);

		await assert.rejects(
			() =>
				useCase.execute({ raffleId: "raffle-1" }).then(
					() => {
						throw new Error("no debería resolver");
					},
					(err) => {
						throw err;
					},
				),
			RaffleAlreadyDrawnError,
		);
	});
});
