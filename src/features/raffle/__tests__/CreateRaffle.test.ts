import assert from "node:assert";
import { before, describe, it } from "node:test";
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

describe("CreateRaffle", () => {
	let useCase: CreateRaffle;
	let raffleRepo: MockRaffleRepository;

	before(() => {
		raffleRepo = new MockRaffleRepository();
		useCase = new CreateRaffle(raffleRepo, noopLogger);
	});

	it("debería crear una raffle", async () => {
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

	it("debería guardar minTickets por defecto en 1", async () => {
		const result = await useCase.execute({
			title: "x",
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
		});
		assert.equal((result as unknown as { minTickets?: number }).minTickets, 1);
	});

	it("debería rechazar minTickets mayor a maxTickets", async () => {
		await assert.rejects(
			() =>
				useCase.execute({
					title: "x",
					startDate: new Date(),
					endDate: new Date(),
					ticketPrice: 1,
					maxTickets: 5,
					minTickets: 6,
				}),
			{ message: /minTickets no puede superar maxTickets/i },
		);
	});

	it("debería guardar ticketIssuance por defecto en random", async () => {
		const result = await useCase.execute({
			title: "x",
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
		});
		assert.equal(
			(result as unknown as { ticketIssuance?: string }).ticketIssuance,
			"random",
		);
	});

	it("debería guardar ticketIssuance consecutiva cuando se indica", async () => {
		const result = await useCase.execute({
			title: "x",
			startDate: new Date(),
			endDate: new Date(),
			ticketPrice: 1,
			maxTickets: 5,
			ticketIssuance: "consecutive",
		});
		assert.equal(
			(result as unknown as { ticketIssuance?: string }).ticketIssuance,
			"consecutive",
		);
	});

	it("debería rechazar ticketIssuance inválido", async () => {
		await assert.rejects(
			() =>
				useCase.execute({
					title: "x",
					startDate: new Date(),
					endDate: new Date(),
					ticketPrice: 1,
					maxTickets: 5,
					ticketIssuance: "pepito" as never,
				}),
			{ message: /ticketIssuance debe ser 'random' o 'consecutive'/i },
		);
	});
});
