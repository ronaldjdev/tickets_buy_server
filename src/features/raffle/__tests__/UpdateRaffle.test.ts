import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	ITicketService,
	TicketPayload,
} from "../../../shared/contracts/ticket/ITicketService.contract.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { UpdateRaffle } from "../application/use-cases/UpdateRaffle.uc.js";
import type { Raffle } from "../domain/entities/Raffle.entity.js";
import { RaffleNotFoundError } from "../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../domain/repositories/IRaffle.repository.js";

function makeRaffle(
	maxTickets: number,
	status: Raffle["status"] = "active",
): Raffle {
	return {
		id: "raffle-1",
		slug: "sorteo",
		title: "Sorteo",
		prizes: [{ type: "mayor", name: "Premio" }],
		startDate: new Date(),
		endDate: new Date(),
		ticketPrice: 10,
		maxTickets,
		status,
	};
}

function makeTickets(
	numbers: Array<{ number: number; status: TicketPayload["status"] }>,
): TicketPayload[] {
	return numbers.map(({ number, status }) => ({
		id: `t${number}`,
		raffleId: "raffle-1",
		number,
		status,
	}));
}

class MockRaffleRepository implements IRaffleRepository {
	store: Raffle[];

	constructor(store: Raffle[]) {
		this.store = store;
	}

	async findById(id: string): Promise<Raffle | null> {
		return this.store.find((r) => r.id === id) || null;
	}

	async findBySlug(slug: string): Promise<Raffle | null> {
		return this.store.find((r) => r.slug === slug) || null;
	}

	async list(): Promise<Raffle[]> {
		return this.store;
	}

	async save(entity: Raffle): Promise<Raffle> {
		this.store.push(entity);
		return entity;
	}

	async update(entity: Raffle): Promise<Raffle> {
		this.store = this.store.map((r) => (r.id === entity.id ? entity : r));
		return entity;
	}

	async delete(id: string): Promise<void> {
		this.store = this.store.filter((r) => r.id !== id);
	}

	async deactivateActiveRaffles(exceptRaffleId: string): Promise<void> {
		this.store = this.store.map((r) =>
			r.status === "active" && r.id !== exceptRaffleId
				? { ...r, status: "draft" }
				: r,
		);
	}
}

class MockTicketService implements ITicketService {
	store: TicketPayload[];
	createdNumbers: number[][] = [];

	constructor(store: TicketPayload[]) {
		this.store = store.map((t) => ({ ...t }));
	}

	async listTickets(raffleId: string): Promise<TicketPayload[]> {
		return this.store.filter((t) => t.raffleId === raffleId);
	}

	async findByRaffle(raffleId: string): Promise<TicketPayload[]> {
		return this.listTickets(raffleId);
	}

	async markAsWinner(ticketId: string): Promise<TicketPayload> {
		const ticket = this.store.find((t) => t.id === ticketId);
		if (!ticket) throw new Error("no encontrado");
		const winner = { ...ticket, status: "winner" as const };
		this.store = this.store.map((t) => (t.id === ticketId ? winner : t));
		return winner;
	}

	async createAvailableTickets(
		raffleId: string,
		numbers: number[],
	): Promise<TicketPayload[]> {
		this.createdNumbers.push(numbers);
		const created = numbers.map((number) => ({
			id: `ticket-${number}`,
			raffleId,
			number,
			status: "available" as const,
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
			(t) => !(t.raffleId === raffleId && t.number > count),
		);
		return before - this.store.length;
	}

	async deleteByRaffle(raffleId: string): Promise<number> {
		const before = this.store.length;
		this.store = this.store.filter((t) => t.raffleId !== raffleId);
		return before - this.store.length;
	}
}

describe("UpdateRaffle", () => {
	it("debería rechazar si no encuentra el sorteo", async () => {
		const raffleRepo = new MockRaffleRepository([]);
		const ticketService = new MockTicketService([]);
		const useCase = new UpdateRaffle(
			raffleRepo,
			ticketService,
			createNoopLogger(),
		);

		await assert.rejects(
			() => useCase.execute({ raffleId: "no-existe", maxTickets: 10 }),
			RaffleNotFoundError,
		);
	});

	it("debería rechazar un sorteo ya sorteado", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle(5, "drawn")]);
		const ticketService = new MockTicketService(
			makeTickets([
				{ number: 1, status: "available" },
				{ number: 2, status: "available" },
				{ number: 3, status: "available" },
				{ number: 4, status: "available" },
				{ number: 5, status: "available" },
			]),
		);
		const useCase = new UpdateRaffle(
			raffleRepo,
			ticketService,
			createNoopLogger(),
		);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1", title: "Otro" }),
			/No se puede editar un sorteo ya sorteado/,
		);
	});

	it("debería crear solo los números faltantes al aumentar", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle(5)]);
		const ticketService = new MockTicketService(
			makeTickets([
				{ number: 1, status: "available" },
				{ number: 2, status: "available" },
				{ number: 3, status: "available" },
				{ number: 4, status: "available" },
				{ number: 5, status: "available" },
			]),
		);
		const useCase = new UpdateRaffle(
			raffleRepo,
			ticketService,
			createNoopLogger(),
		);

		const updated = await useCase.execute({
			raffleId: "raffle-1",
			maxTickets: 7,
		});

		assert.equal(updated.maxTickets, 7);
		assert.deepEqual(ticketService.createdNumbers, [[6, 7]]);
		assert.deepEqual(
			ticketService.store.map((t) => t.number).sort((a, b) => a - b),
			[1, 2, 3, 4, 5, 6, 7],
		);
	});

	it("debería rellenar los huecos sin duplicar al aumentar tras reducir", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle(6)]);
		const ticketService = new MockTicketService(
			makeTickets([
				{ number: 1, status: "available" },
				{ number: 2, status: "available" },
				{ number: 3, status: "available" },
				{ number: 4, status: "available" },
				{ number: 5, status: "available" },
				{ number: 7, status: "purchased" },
			]),
		);
		const useCase = new UpdateRaffle(
			raffleRepo,
			ticketService,
			createNoopLogger(),
		);

		const updated = await useCase.execute({
			raffleId: "raffle-1",
			maxTickets: 10,
		});

		assert.equal(updated.maxTickets, 10);
		assert.deepEqual(ticketService.createdNumbers, [[6, 8, 9, 10]]);
		const numbers = ticketService.store
			.map((t) => t.number)
			.sort((a, b) => a - b);
		assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		assert.equal(new Set(ticketService.store.map((t) => t.id)).size, 10);
	});

	it("debería rechazar reducir por debajo del número de un boleto vendido", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle(7)]);
		const ticketService = new MockTicketService(
			makeTickets([
				{ number: 1, status: "available" },
				{ number: 2, status: "available" },
				{ number: 3, status: "available" },
				{ number: 4, status: "available" },
				{ number: 5, status: "available" },
				{ number: 6, status: "available" },
				{ number: 7, status: "purchased" },
			]),
		);
		const useCase = new UpdateRaffle(
			raffleRepo,
			ticketService,
			createNoopLogger(),
		);

		await assert.rejects(
			() => useCase.execute({ raffleId: "raffle-1", maxTickets: 3 }),
			/maxTickets no puede ser menor al número de un boleto vendido/,
		);
		assert.equal(ticketService.store.length, 7);
	});

	it("debería eliminar los disponibles fuera de rango al reducir", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle(10)]);
		const ticketService = new MockTicketService(
			makeTickets([
				{ number: 1, status: "available" },
				{ number: 2, status: "available" },
				{ number: 3, status: "available" },
				{ number: 4, status: "available" },
				{ number: 5, status: "available" },
				{ number: 6, status: "available" },
				{ number: 7, status: "available" },
				{ number: 8, status: "available" },
				{ number: 9, status: "available" },
				{ number: 10, status: "available" },
			]),
		);
		const useCase = new UpdateRaffle(
			raffleRepo,
			ticketService,
			createNoopLogger(),
		);

		const updated = await useCase.execute({
			raffleId: "raffle-1",
			maxTickets: 5,
		});

		assert.equal(updated.maxTickets, 5);
		assert.equal(ticketService.createdNumbers.length, 0);
		assert.deepEqual(
			ticketService.store.map((t) => t.number).sort((a, b) => a - b),
			[1, 2, 3, 4, 5],
		);
	});

	it("no debería tocar los tickets al cambiar solo el título", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle(5)]);
		const ticketService = new MockTicketService(
			makeTickets([
				{ number: 1, status: "available" },
				{ number: 2, status: "available" },
				{ number: 3, status: "available" },
				{ number: 4, status: "available" },
				{ number: 5, status: "available" },
			]),
		);
		const before = ticketService.store.length;
		const useCase = new UpdateRaffle(
			raffleRepo,
			ticketService,
			createNoopLogger(),
		);

		const updated = await useCase.execute({
			raffleId: "raffle-1",
			title: "Nuevo título",
		});

		assert.equal(updated.title, "Nuevo título");
		assert.equal(updated.slug, "nuevo-titulo");
		assert.equal(ticketService.createdNumbers.length, 0);
		assert.equal(ticketService.store.length, before);
	});
});
