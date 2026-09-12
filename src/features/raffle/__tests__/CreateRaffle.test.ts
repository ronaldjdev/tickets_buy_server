import assert from "node:assert";
import { before, describe, it } from "node:test";
import type {
	ITicketService,
	TicketPayload,
} from "../../../shared/contracts/ticket/ITicketService.contract.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { CreateRaffle } from "../application/use-cases/CreateRaffle.uc.js";
import type { Raffle } from "../domain/entities/Raffle.entity.js";
import type { IRaffleRepository } from "../domain/repositories/IRaffle.repository.js";

const noopLogger = createNoopLogger();

class MockRaffleRepository implements IRaffleRepository {
	private store: Raffle[] = [];

	async findById(id: string): Promise<Raffle | null> {
		return this.store.find((e) => e.id === id) || null;
	}

	async findBySlug(slug: string): Promise<Raffle | null> {
		return this.store.find((e) => e.slug === slug) || null;
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

	async delete(id: string): Promise<void> {
		this.store = this.store.filter((e) => e.id !== id);
	}

	async deactivateActiveRaffles(exceptRaffleId: string): Promise<void> {
		this.store = this.store.map((e) =>
			e.status === "active" && e.id !== exceptRaffleId
				? { ...e, status: "draft" }
				: e,
		);
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
		numbers: number[],
	): Promise<TicketPayload[]> {
		const created: TicketPayload[] = numbers.map((number) => ({
			id: `ticket-${raffleId}-${number}`,
			raffleId,
			number,
			status: "available",
		}));
		this.store.push(...created);
		return created;
	}

	async releaseAvailableBeyond(
		raffleId: string,
		count: number,
	): Promise<number> {
		const before = this.store.length;
		this.store = this.store.filter(
			(e) => !(e.raffleId === raffleId && e.number > count),
		);
		return before - this.store.length;
	}

	async deleteByRaffle(raffleId: string): Promise<number> {
		const before = this.store.length;
		this.store = this.store.filter((e) => e.raffleId !== raffleId);
		return before - this.store.length;
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
		useCase = new CreateRaffle(raffleRepo, ticketService, noopLogger);
	});

	it("debería crear una raffle y sus tickets", async () => {
		const command = {
			title: "Sorteo PS5",
			prizes: [
				{ type: "mayor" as const, name: "PlayStation 5" },
				{ type: "seco1" as const, name: "Audífonos" },
			],
			startDate: new Date("2026-09-01"),
			endDate: new Date("2026-09-30"),
			ticketPrice: 10,
			maxTickets: 5,
			status: "active" as const,
		};

		const result = await useCase.execute(command);
		assert.ok(result);
		assert.equal(result.title, "Sorteo PS5");
		assert.equal(result.slug, "sorteo-ps5");
		assert.deepEqual(result.prizes, command.prizes);
		const id = (result as unknown as { id: string }).id;
		assert.ok(id.length > 0);

		assert.equal(ticketService.countByRaffle(id), 5);
	});

	it("debería permitir sorteo sin premios", async () => {
		const result = await useCase.execute({
			title: "Sorteo sin premio",
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
		});
		assert.deepEqual(result.prizes, []);
	});

	it("debería generar slugs únicos ante colisiones", async () => {
		await useCase.execute({
			title: "Sorteo Premium",
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
		});

		const second = await useCase.execute({
			title: "Sorteo Premium",
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
		});

		assert.equal(second.slug, "sorteo-premium-2");
	});

	it("debería mantener un solo sorteo activo a la vez", async () => {
		const first = await useCase.execute({
			title: "Sorteo Activo A",
			status: "active" as const,
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
		});

		const second = await useCase.execute({
			title: "Sorteo Activo B",
			status: "active" as const,
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
		});

		const active = (await raffleRepo.list()).filter(
			(r) => r.status === "active",
		);
		assert.equal(active.length, 1);
		assert.equal(active[0].id, (second as unknown as { id: string }).id);
		assert.equal(
			(await raffleRepo.findById((first as unknown as { id: string }).id))
				?.status,
			"draft",
		);
	});

	it("debería rechazar maxTickets <= 0", async () => {
		await assert.rejects(
			() =>
				useCase.execute({
					title: "x",
					startDate: new Date(),
					endDate: new Date(),
					ticketPrice: 1,
					maxTickets: 0,
				}),
			{ message: /maxTickets debe ser mayor a 0/i },
		);
	});
});
