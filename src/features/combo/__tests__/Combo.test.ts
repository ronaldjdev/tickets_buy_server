import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	IRaffleService,
	RafflePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../shared/errors/UseCaseError.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { RaffleNotFoundError } from "../../ticket/domain/errors/Ticket.error.js";
import { CreateCombo } from "../application/use-cases/CreateCombo.uc.js";
import { DeleteCombo } from "../application/use-cases/DeleteCombo.uc.js";
import { ListCombos } from "../application/use-cases/ListCombos.uc.js";
import { UpdateCombo } from "../application/use-cases/UpdateCombo.uc.js";
import type { Combo } from "../domain/entities/Combo.entity.js";
import { ComboNotFoundError } from "../domain/errors/Combo.error.js";
import type { IComboRepository } from "../domain/repositories/ICombo.repository.js";

const noopLogger = createNoopLogger();

class MockComboRepo implements IComboRepository {
	combos: Combo[] = [];

	async save(combo: Combo): Promise<Combo | null> {
		this.combos.push(combo);
		return combo;
	}

	async findById(id: string): Promise<Combo | null> {
		return this.combos.find((c) => c.id === id) || null;
	}

	async byRaffle(raffleId: string): Promise<Combo[]> {
		return this.combos
			.filter((c) => c.raffleId === raffleId)
			.sort((a, b) => {
				const ra = a.recommended ? 1 : 0;
				const rb = b.recommended ? 1 : 0;
				if (rb !== ra) return rb - ra;
				return a.ticketCount - b.ticketCount;
			});
	}

	async list(): Promise<Combo[]> {
		return [...this.combos];
	}

	async update(id: string, data: Partial<Combo>): Promise<Combo | null> {
		const index = this.combos.findIndex((c) => c.id === id);
		if (index === -1) return null;
		this.combos[index] = { ...this.combos[index], ...data };
		return this.combos[index];
	}

	async delete(id: string): Promise<boolean> {
		const before = this.combos.length;
		this.combos = this.combos.filter((c) => c.id !== id);
		return this.combos.length < before;
	}

	async clearRecommended(raffleId: string, exceptId: string): Promise<void> {
		for (const combo of this.combos) {
			if (combo.raffleId === raffleId && combo.id !== exceptId) {
				combo.recommended = false;
			}
		}
	}
}

class MockRaffleService implements IRaffleService {
	constructor(raffle: RafflePayload | null) {
		this.raffle = raffle;
	}
	raffle: RafflePayload | null;
	async findById(): Promise<RafflePayload | null> {
		return this.raffle;
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

function build() {
	const repo = new MockComboRepo();
	const raffleService = new MockRaffleService(makeRaffle());
	return { repo, raffleService };
}

describe("CreateCombo", () => {
	it("debería crear un combo con números dentro del rango de la sorteo", async () => {
		const { repo, raffleService } = build();
		const uc = new CreateCombo(repo, raffleService, noopLogger);

		const combo = await uc.execute({
			raffleId: "raffle-1",
			name: "Combo 2 boletos",
			ticketCount: 2,
			price: 18000,
		});

		assert.equal(combo.id.length > 0, true);
		assert.equal(combo.raffleId, "raffle-1");
		assert.equal(combo.name, "Combo 2 boletos");
		assert.equal(combo.ticketCount, 2);
		assert.equal(combo.price, 18000);
		assert.equal(repo.combos.length, 1);
	});

	it("debería rechazar nombre vacío, ticketCount 0 y precio negativo", async () => {
		const { repo, raffleService } = build();
		const uc = new CreateCombo(repo, raffleService, noopLogger);

		await assert.rejects(
			() => uc.execute({ raffleId: "r", name: " ", ticketCount: 1, price: 10 }),
			UseCaseError,
		);
		await assert.rejects(
			() => uc.execute({ raffleId: "r", name: "x", ticketCount: 0, price: 10 }),
			UseCaseError,
		);
		await assert.rejects(
			() => uc.execute({ raffleId: "r", name: "x", ticketCount: 1, price: -5 }),
			UseCaseError,
		);
	});

	it("debería rechazar si la sorteo no existe o el combo excede el rango", async () => {
		const { repo, raffleService } = build();
		const uc = new CreateCombo(repo, raffleService, noopLogger);

		raffleService.raffle = null;
		await assert.rejects(
			() => uc.execute({ raffleId: "x", name: "y", ticketCount: 1, price: 1 }),
			RaffleNotFoundError,
		);

		raffleService.raffle = makeRaffle();
		await assert.rejects(
			() =>
				uc.execute({
					raffleId: "raffle-1",
					name: "y",
					ticketCount: 11,
					price: 1,
				}),
			UseCaseError,
		);
	});

	it("debería rechazar un combo por debajo del mínimo de compra", async () => {
		const { repo, raffleService } = build();
		const uc = new CreateCombo(repo, raffleService, noopLogger);

		raffleService.raffle = { ...makeRaffle(), minTickets: 5 };
		await assert.rejects(
			() =>
				uc.execute({
					raffleId: "raffle-1",
					name: "y",
					ticketCount: 2,
					price: 18000,
				}),
			(e: Error) =>
				e instanceof UseCaseError &&
				e.message.includes("mínimo de compra de la sorteo"),
		);

		const combo = await uc.execute({
			raffleId: "raffle-1",
			name: "Combo 5 boletos",
			ticketCount: 5,
			price: 40000,
		});
		assert.equal(combo.ticketCount, 5);
		assert.equal(repo.combos.length, 1);
	});

	it("debería rechazar si ya existe un combo con el mismo nombre en la sorteo", async () => {
		const { repo, raffleService } = build();
		const uc = new CreateCombo(repo, raffleService, noopLogger);

		await uc.execute({
			raffleId: "raffle-1",
			name: "Combo",
			ticketCount: 1,
			price: 5000,
		});
		await assert.rejects(
			() =>
				uc.execute({
					raffleId: "raffle-1",
					name: "Combo",
					ticketCount: 2,
					price: 9000,
				}),
			UseCaseError,
		);
	});
});

describe("ListCombos / UpdateCombo / DeleteCombo", () => {
	it("debería listar por sorteo y completos", async () => {
		const repo = new MockComboRepo();
		repo.combos = [
			{ id: "a", raffleId: "r1", name: "A", ticketCount: 1, price: 10, plays: 0 },
			{ id: "b", raffleId: "r2", name: "B", ticketCount: 1, price: 10, plays: 0 },
			{ id: "c", raffleId: "r1", name: "C", ticketCount: 1, price: 10, plays: 0 },
		];
		const uc = new ListCombos(repo);

		assert.equal((await uc.execute("r1")).length, 2);
		assert.equal((await uc.execute()).length, 3);
	});

	it("debería actualizar con validación de rango", async () => {
		const { repo, raffleService } = build();
		const created = await new CreateCombo(
			repo,
			raffleService,
			noopLogger,
		).execute({
			raffleId: "raffle-1",
			name: "Combo",
			ticketCount: 1,
			price: 5000,
		});
		const uc = new UpdateCombo(repo, raffleService, noopLogger);

		const updated = await uc.execute({
			id: created.id,
			price: 6000,
			ticketCount: 2,
		});
		assert.equal(updated.price, 6000);
		assert.equal(updated.ticketCount, 2);

		await assert.rejects(
			() => uc.execute({ id: created.id, ticketCount: 11 }),
			UseCaseError,
		);
	});

	it("debería recomendar y quitar la recomendación de un combo", async () => {
		const { repo, raffleService } = build();
		const created = await new CreateCombo(
			repo,
			raffleService,
			noopLogger,
		).execute({
			raffleId: "raffle-1",
			name: "Combo",
			ticketCount: 1,
			price: 5000,
		});
		const uc = new UpdateCombo(repo, raffleService, noopLogger);

		const recommended = await uc.execute({ id: created.id, recommended: true });
		assert.equal(recommended.recommended, true);

		const normal = await uc.execute({ id: created.id, recommended: false });
		assert.equal(normal.recommended, false);

		const untouched = await uc.execute({
			id: created.id,
			name: "  Renombrado  ",
		});
		assert.equal(untouched.recommended, false);
		assert.equal(untouched.name, "Renombrado");
	});

	it("debería des-recomendar los demás combos de la rifa al recomendar uno", async () => {
		const { repo, raffleService } = build();
		const create = new CreateCombo(repo, raffleService, noopLogger);
		const a = await create.execute({
			raffleId: "raffle-1",
			name: "Combo A",
			ticketCount: 1,
			price: 5000,
		});
		const b = await create.execute({
			raffleId: "raffle-1",
			name: "Combo B",
			ticketCount: 2,
			price: 9000,
		});
		const uc = new UpdateCombo(repo, raffleService, noopLogger);

		await uc.execute({ id: a.id, recommended: true });
		await uc.execute({ id: b.id, recommended: true });

		const after = await repo.byRaffle("raffle-1");
		assert.equal(after.filter((combo) => combo.recommended).length, 1);
		assert.equal(after.find((combo) => combo.id === b.id)?.recommended, true);
		assert.equal(after.find((combo) => combo.id === a.id)?.recommended, false);
	});

	it("debería listar los combos recomendados primero por sorteo", async () => {
		const repo = new MockComboRepo();
		repo.combos = [
			{ id: "a", raffleId: "r1", name: "A", ticketCount: 5, price: 10, plays: 0 },
			{
				id: "b",
				raffleId: "r1",
				name: "B",
				ticketCount: 1,
				price: 10,
				plays: 3,
				recommended: true,
			},
			{ id: "c", raffleId: "r1", name: "C", ticketCount: 2, price: 10, plays: 0 },
		];
		const uc = new ListCombos(repo);

		const listed = await uc.execute("r1");
		assert.equal(listed[0].id, "b");
		assert.equal(listed[0].recommended, true);
	});

	it("debería fallar al actualizar/eliminar un combo inexistente", async () => {
		const { repo, raffleService } = build();
		const update = new UpdateCombo(repo, raffleService, noopLogger);
		const del = new DeleteCombo(repo, noopLogger);

		await assert.rejects(
			() => update.execute({ id: "nope" }),
			ComboNotFoundError,
		);
		await assert.rejects(() => del.execute("nope"), ComboNotFoundError);
	});

	it("debería eliminar un combo existente", async () => {
		const { repo, raffleService } = build();
		const created = await new CreateCombo(
			repo,
			raffleService,
			noopLogger,
		).execute({
			raffleId: "raffle-1",
			name: "Combo",
			ticketCount: 1,
			price: 5000,
		});

		const ok = await new DeleteCombo(repo, noopLogger).execute(created.id);
		assert.equal(ok, true);
		assert.equal(repo.combos.length, 0);
	});
});
