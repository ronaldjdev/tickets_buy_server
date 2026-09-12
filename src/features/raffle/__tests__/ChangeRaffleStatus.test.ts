import assert from "node:assert";
import { describe, it } from "node:test";
import type { NotificationService } from "../../../features/notification/application/services/NotificationService.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { ChangeRaffleStatus } from "../application/use-cases/ChangeRaffleStatus.uc.js";
import type { Raffle } from "../domain/entities/Raffle.entity.js";
import type { IRaffleRepository } from "../domain/repositories/IRaffle.repository.js";

const noopLogger = createNoopLogger();

function makeRaffle(
	id: string,
	title: string,
	status: Raffle["status"],
): Raffle {
	return {
		id,
		slug: id,
		title,
		prizes: [],
		startDate: new Date(),
		endDate: new Date(),
		ticketPrice: 10,
		maxTickets: 10,
		status,
	};
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

function makeNotificationService(): NotificationService {
	return {
		notifyUsers: async () => {},
	} as unknown as NotificationService;
}

describe("ChangeRaffleStatus", () => {
	it("debería auto-pausar el sorteo activo previo al activar otro", async () => {
		const activeOne = makeRaffle("one", "Sorteo uno", "active");
		const raffleRepo = new MockRaffleRepository([
			activeOne,
			makeRaffle("two", "Sorteo dos", "draft"),
		]);
		const useCase = new ChangeRaffleStatus(
			raffleRepo,
			makeNotificationService(),
			noopLogger,
		);

		const activated = await useCase.execute({
			raffleId: "two",
			status: "active",
		});

		assert.equal(activated.status, "active");
		assert.equal((await raffleRepo.findById("one"))?.status, "draft");
		assert.equal(
			(await raffleRepo.list()).filter((r) => r.status === "active").length,
			1,
		);
	});

	it("debería permitir pausar el sorteo activo", async () => {
		const raffleRepo = new MockRaffleRepository([
			makeRaffle("one", "Sorteo uno", "active"),
		]);
		const useCase = new ChangeRaffleStatus(raffleRepo, undefined, noopLogger);

		const paused = await useCase.execute({
			raffleId: "one",
			status: "draft",
		});

		assert.equal(paused.status, "draft");
		assert.equal(
			(await raffleRepo.list()).filter((r) => r.status === "active").length,
			0,
		);
	});
});
