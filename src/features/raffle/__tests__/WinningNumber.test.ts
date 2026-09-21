import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	ITicketService,
	TicketPayload,
} from "../../../shared/contracts/ticket/ITicketService.contract.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { DrawWinner } from "../application/use-cases/DrawWinner.uc.js";
import { ExpediteWinningNumber } from "../application/use-cases/ExpediteWinningNumber.uc.js";
import {
	getWinningNumberStatus,
	type Raffle,
	type RafflePrize,
	validateWinningNumberConfig,
} from "../domain/entities/Raffle.entity.js";
import {
	PrizeWithoutWinningNumberError,
	RaffleAlreadyDrawnError,
	RaffleNotFoundError,
	WinningNumberAlreadyExpeditedError,
	WinningNumberSalesNotReachedError,
} from "../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../domain/repositories/IRaffle.repository.js";

const noopLogger = createNoopLogger();

function makeRaffle(partial: Partial<Raffle> = {}): Raffle {
	return {
		id: "raffle-1",
		slug: "sorteo",
		title: "Sorteo",
		prizes: [
			{
				type: "mayor",
				name: "Premio",
				winningNumber: 7,
				winningMinSoldTickets: 3,
			},
		],
		startDate: new Date(),
		endDate: new Date(),
		ticketPrice: 10,
		maxTickets: 10,
		status: "active",
		...partial,
	};
}

class MockRaffleRepository implements IRaffleRepository {
	constructor(private store: Raffle[]) {}

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

	async delete(): Promise<void> {}

	async deactivateActiveRaffles(): Promise<void> {}

	async claimMachineSecoPrize(): Promise<boolean> {
		return false;
	}

	async decrementMachineInstantStock(): Promise<boolean> {
		return false;
	}

	async releaseMachineSecoPrize(): Promise<boolean> {
		return false;
	}

	async restockMachineInstantPrize(): Promise<boolean> {
		return false;
	}
}

class MockTicketService implements ITicketService {
	sold: number;
	created: TicketPayload[] = [];

	constructor(sold: number) {
		this.sold = sold;
	}

	async listTickets(raffleId: string): Promise<TicketPayload[]> {
		return this.created.filter((t) => t.raffleId === raffleId);
	}

	async findByRaffle(raffleId: string): Promise<TicketPayload[]> {
		return this.listTickets(raffleId);
	}

	async markAsWinner(ticketId: string): Promise<TicketPayload> {
		const ticket = this.created.find((t) => t.id === ticketId);
		if (!ticket) throw new Error("no encontrado");
		const winner = { ...ticket, status: "winner" as const };
		this.created = this.created.map((t) => (t.id === ticketId ? winner : t));
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
		this.created.push(ticket);
		return ticket;
	}

	async countSoldTickets(): Promise<number> {
		return this.sold;
	}

	async releaseAvailableBeyond(): Promise<number> {
		return 0;
	}

	async deleteByRaffle(): Promise<number> {
		return 0;
	}
}

describe("getWinningNumberStatus", () => {
	it("debería devolver null si el premio no tiene número ganador", () => {
		const prize: RafflePrize = { type: "mayor", name: "Premio" };
		assert.equal(getWinningNumberStatus(prize, 100), null);
	});

	it("debería devolver blocked si las ventas no alcanzan el mínimo", () => {
		const prize = makeRaffle().prizes![0];
		assert.equal(getWinningNumberStatus(prize, 2), "blocked");
	});

	it("debería devolver enabled al alcanzar el mínimo", () => {
		const prize = makeRaffle().prizes![0];
		assert.equal(getWinningNumberStatus(prize, 3), "enabled");
	});

	it("debería devolver expedited aunque no se alcance el mínimo", () => {
		const prize: RafflePrize = {
			...makeRaffle().prizes![0],
			winningExpeditedAt: "2026-01-01T00:00:00.000Z",
		};
		assert.equal(getWinningNumberStatus(prize, 0), "expedited");
	});

	it("sin mínimo configurado el número queda blocked", () => {
		const prize: RafflePrize = {
			type: "mayor",
			name: "Premio",
			winningNumber: 7,
		};
		assert.equal(getWinningNumberStatus(prize, 999), "blocked");
	});
});

describe("validateWinningNumberConfig", () => {
	it("debería validar una configuración correcta", () => {
		assert.doesNotThrow(() =>
			validateWinningNumberConfig(
				[
					{
						type: "mayor",
						name: "Premio",
						winningNumber: 7,
						winningMinSoldTickets: 3,
					},
				],
				10,
			),
		);
	});

	it("debería rechazar un número ganador fuera de rango", () => {
		assert.throws(
			() =>
				validateWinningNumberConfig(
					[{ type: "mayor", name: "Premio", winningNumber: 11 }],
					10,
				),
			/E1 entre 1 y 10|entre 1 y 10/,
		);
	});

	it("debería rechazar un mínimo fuera de rango", () => {
		assert.throws(
			() =>
				validateWinningNumberConfig(
					[
						{
							type: "mayor",
							name: "Premio",
							winningNumber: 7,
							winningMinSoldTickets: 0,
						},
					],
					10,
				),
			/entre 1 y 10/,
		);
	});

	it("debería rechazar el mismo número ganador en dos premios", () => {
		assert.throws(
			() =>
				validateWinningNumberConfig(
					[
						{ type: "mayor", name: "A", winningNumber: 7 },
						{ type: "seco1", name: "B", winningNumber: 7 },
					],
					10,
				),
			/no puede asignarse a dos premios/,
		);
	});

	it("debería rechazar un mínimo sin número ganador", () => {
		assert.throws(
			() =>
				validateWinningNumberConfig(
					[{ type: "mayor", name: "Premio", winningMinSoldTickets: 3 }],
					10,
				),
			/sin un número ganador/,
		);
	});
});

describe("ExpediteWinningNumber", () => {
	it("debería expedir el número ganador alcanzando el mínimo", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle()]);
		const ticketService = new MockTicketService(3);
		const useCase = new ExpediteWinningNumber(
			raffleRepo,
			ticketService,
			noopLogger,
		);

		const result = await useCase.execute({
			raffleId: "raffle-1",
			prizeType: "mayor",
			expeditedBy: "admin@mail.com",
		});

		const mayor = result.prizes!.find((p) => p.type === "mayor")!;
		assert.ok(mayor.winningExpeditedAt, "guarda fecha de expedición");
		assert.equal(mayor.winningExpeditedBy, "admin@mail.com");
		assert.equal(getWinningNumberStatus(mayor, 3), "expedited");
	});

	it("debería permitir expedir sin mínimo configurado", async () => {
		const raffleRepo = new MockRaffleRepository([
			makeRaffle({
				prizes: [{ type: "mayor", name: "Premio", winningNumber: 7 }],
			}),
		]);
		const useCase = new ExpediteWinningNumber(
			raffleRepo,
			new MockTicketService(0),
			noopLogger,
		);

		const result = await useCase.execute({
			raffleId: "raffle-1",
			prizeType: "mayor",
			expeditedBy: "admin@mail.com",
		});
		assert.ok(result.prizes![0].winningExpeditedAt);
	});

	it("debería fallar si las ventas no alcanzan el mínimo", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle()]);
		const useCase = new ExpediteWinningNumber(
			raffleRepo,
			new MockTicketService(2),
			noopLogger,
		);

		await assert.rejects(
			() =>
				useCase.execute({
					raffleId: "raffle-1",
					prizeType: "mayor",
					expeditedBy: "admin@mail.com",
				}),
			WinningNumberSalesNotReachedError,
		);
	});

	it("debería fallar una doble expedición", async () => {
		const raffleRepo = new MockRaffleRepository([makeRaffle()]);
		const ticketService = new MockTicketService(5);
		const useCase = new ExpediteWinningNumber(
			raffleRepo,
			ticketService,
			noopLogger,
		);

		await useCase.execute({
			raffleId: "raffle-1",
			prizeType: "mayor",
			expeditedBy: "admin@mail.com",
		});
		await assert.rejects(
			() =>
				useCase.execute({
					raffleId: "raffle-1",
					prizeType: "mayor",
					expeditedBy: "admin@mail.com",
				}),
			WinningNumberAlreadyExpeditedError,
		);
	});

	it("debería fallar si el premio no tiene número ganador", async () => {
		const raffleRepo = new MockRaffleRepository([
			makeRaffle({ prizes: [{ type: "mayor", name: "Premio" }] }),
		]);
		const useCase = new ExpediteWinningNumber(
			raffleRepo,
			new MockTicketService(5),
			noopLogger,
		);

		await assert.rejects(
			() =>
				useCase.execute({
					raffleId: "raffle-1",
					prizeType: "mayor",
					expeditedBy: "admin@mail.com",
				}),
			PrizeWithoutWinningNumberError,
		);
	});

	it("debería fallar si el sorteo ya fue sorteado", async () => {
		const raffleRepo = new MockRaffleRepository([
			makeRaffle({ status: "drawn" }),
		]);
		const useCase = new ExpediteWinningNumber(
			raffleRepo,
			new MockTicketService(5),
			noopLogger,
		);

		await assert.rejects(
			() =>
				useCase.execute({
					raffleId: "raffle-1",
					prizeType: "mayor",
					expeditedBy: "admin@mail.com",
				}),
			RaffleAlreadyDrawnError,
		);
	});

	it("debería fallar si el sorteo no existe", async () => {
		const useCase = new ExpediteWinningNumber(
			new MockRaffleRepository([]),
			new MockTicketService(5),
			noopLogger,
		);

		await assert.rejects(
			() =>
				useCase.execute({
					raffleId: "no-existe",
					prizeType: "mayor",
					expeditedBy: "admin@mail.com",
				}),
			RaffleNotFoundError,
		);
	});
});

describe("DrawWinner con número ganador expedido", () => {
	it("debería crear el boleto garantizado y asignarlo como ganador", async () => {
		const raffle = makeRaffle({
			prizes: [
				{
					type: "mayor",
					name: "Premio",
					winningNumber: 7,
					winningMinSoldTickets: 3,
					winningExpeditedAt: "2026-01-01T00:00:00.000Z",
					winningExpeditedBy: "admin@mail.com",
				},
			],
		});
		const raffleRepo = new MockRaffleRepository([raffle]);
		const ticketService = new MockTicketService(3);
		const useCase = new DrawWinner(
			raffleRepo,
			ticketService,
			undefined,
			noopLogger,
		);

		const drawn = await useCase.execute({ raffleId: "raffle-1" });

		assert.equal(drawn.status, "drawn");
		const guaranteed = ticketService.created.find(
			(t) => t.status === "guaranteed",
		);
		assert.ok(guaranteed, "crea un boleto garantizado");
		assert.equal(guaranteed.number, 7);
		assert.equal(drawn.winnerTicketId, guaranteed.id);
	});

	it("debería priorizar el premio mayor expedido", async () => {
		const raffle = makeRaffle({
			prizes: [
				{
					type: "mayor",
					name: "Mayor",
					winningNumber: 7,
					winningExpeditedAt: "2026-01-01T00:00:00.000Z",
				},
				{
					type: "seco1",
					name: "Seco",
					winningNumber: 9,
					winningExpeditedAt: "2026-01-01T00:00:00.000Z",
				},
			],
		});
		const raffleRepo = new MockRaffleRepository([raffle]);
		const ticketService = new MockTicketService(5);
		const useCase = new DrawWinner(
			raffleRepo,
			ticketService,
			undefined,
			noopLogger,
		);

		const drawn = await useCase.execute({ raffleId: "raffle-1" });
		const guaranteed = ticketService.created.find(
			(t) => t.status === "guaranteed",
		);
		assert.equal(guaranteed?.number, 7);
		assert.equal(drawn.winnerTicketId, guaranteed?.id);
	});
});
