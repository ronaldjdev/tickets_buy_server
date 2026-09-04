import assert from "node:assert";
import { before, describe, it } from "node:test";
import type {
	ITicketService,
	TicketPayload,
} from "../../../shared/contracts/ticket/ITicketService.contract.js";
import { CreateRaffle } from "../application/use-cases/CreateRaffle.uc.js";
import type { Raffle } from "../domain/entities/Raffle.entity.js";
import type { IRaffleRepository } from "../domain/repositories/IRaffle.repository.js";

class MockRaffleRepository implements IRaffleRepository {
	private store: Raffle[] = [];

	async findById(id: string): Promise<Raffle | null> {
		return this.store.find((e) => e.id === id) || null;
	}

	async list(): Promise<Raffle[]> {
		return this.store;
	}

	async save(entity: Raffle): Promise<Raffle> {
		this.store.push(entity);
		return entity;
	}

	async update(entity: Raffle): Promise<Raffle> {
		this.store = this.store.map((e) => (e.id === entity.id ? entity : e));
		return entity;
	}
}

class MockTicketService implements ITicketService {
	private store: TicketPayload[] = [];

	async listTickets(raffleId: string): Promise<TicketPayload[]> {
		return this.store.filter((e) => e.raffleId === raffleId);
	}

	async findByRaffle(raffleId: string): Promise<TicketPayload[]> {
		return this.listTickets(raffleId);
	}

	async markAsWinner(ticketId: string): Promise<TicketPayload> {
		let winner!: TicketPayload;
		this.store = this.store.map((e) => {
			if (e.id === ticketId) {
				winner = { ...e, status: "winner" };
				return winner;
			}
			return e;
		});
		return winner;
	}

	async createAvailableTickets(
		raffleId: string,
		count: number,
	): Promise<TicketPayload[]> {
		const created: TicketPayload[] = Array.from({ length: count }, (_, i) => ({
			id: `ticket-${raffleId}-${i}`,
			raffleId,
			number: i + 1,
			status: "available",
		}));
		this.store.push(...created);
		return created;
	}

	countByRaffle(raffleId: string): number {
		return this.store.filter((e) => e.raffleId === raffleId).length;
	}
}

describe("CreateRaffle", () => {
	let useCase: CreateRaffle;
	let raffleRepo: MockRaffleRepository;
	let ticketService: MockTicketService;

	before(() => {
		raffleRepo = new MockRaffleRepository();
		ticketService = new MockTicketService();
		useCase = new CreateRaffle(raffleRepo, ticketService);
	});

	it("debería crear una raffle y sus tickets", async () => {
		const command = {
			title: "Sorteo PS5",
			prize: { name: "PlayStation 5" },
			startDate: new Date("2026-09-01"),
			endDate: new Date("2026-09-30"),
			ticketPrice: 10,
			maxTickets: 5,
			status: "active" as const,
		};

		const result = await useCase.execute(command);
		assert.ok(result);
		assert.equal(result.title, "Sorteo PS5");
		const id = (result as unknown as { id: string }).id;
		assert.ok(id.length > 0);

		assert.equal(ticketService.countByRaffle(id), 5);
	});

	it("debería rechazar maxTickets <= 0", async () => {
		await assert.rejects(
			() =>
				useCase.execute({
					title: "x",
					prize: { name: "p" },
					startDate: new Date(),
					endDate: new Date(),
					ticketPrice: 1,
					maxTickets: 0,
				}),
			{ message: /maxTickets debe ser mayor a 0/i },
		);
	});
});
