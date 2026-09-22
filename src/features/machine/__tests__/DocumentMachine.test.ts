import assert from "node:assert";
import { describe, it } from "node:test";
import type { IMachineSettings } from "../../../shared/contracts/IMachineSettings.contract.js";
import type {
	IRaffleService,
	RafflePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import type { GatewayIntent } from "../../gateway/domain/entities/GatewayIntent.entity.js";
import type { Ticket } from "../../ticket/domain/entities/Ticket.entity.js";
import { GetDocumentMachineOverview } from "../application/use-cases/GetDocumentMachineOverview.uc.js";
import { PlayMachineByDocument } from "../application/use-cases/PlayMachineByDocument.uc.js";
import type { MachineGrant } from "../domain/entities/MachineGrant.entity.js";
import type { MachinePlay } from "../domain/entities/MachinePlay.entity.js";
import { MachineNoPlaysError } from "../domain/errors/Machine.error.js";

const noopLogger = createNoopLogger();

const settings: IMachineSettings = {
	isEnabled: async () => true,
	setEnabled: async () => {},
	getPlaysRule: async () => null,
	setPlaysRule: async () => {},
};

class MockIntentRepo {
	paid: GatewayIntent[] = [];

	async findPaidByDocumentNumber(
		documentNumber: string,
		raffleId?: string,
	): Promise<GatewayIntent[]> {
		return this.paid.filter(
			(i) =>
				i.buyerDocumentNumber === documentNumber &&
				(!raffleId || i.raffleId === raffleId),
		);
	}

	async findPaidByPurchaseIds(purchaseIds: string[]): Promise<GatewayIntent[]> {
		return this.paid.filter((i) => purchaseIds.includes(i.purchaseId));
	}

	async findByReference(reference: string): Promise<GatewayIntent | null> {
		return this.paid.find((i) => i.reference === reference) ?? null;
	}
}

class MockTicketRepo {
	tickets: Ticket[] = [];

	async findByDocumentNumber(): Promise<Ticket[]> {
		return this.tickets;
	}

	async findByIds(): Promise<Ticket[]> {
		return this.tickets;
	}
}

class MockRaffleService {
	raffle: RafflePayload | null;

	constructor(raffle: RafflePayload | null) {
		this.raffle = raffle;
	}

	async findById(): Promise<RafflePayload | null> {
		return this.raffle;
	}
}

class MockRaffleRepo {
	async claimMachineSecoPrize(): Promise<boolean> {
		return false;
	}

	async decrementMachineInstantStock(): Promise<boolean> {
		return false;
	}
}

class MockPlayRepo {
	plays: MachinePlay[] = [];

	async save(play: MachinePlay): Promise<MachinePlay> {
		this.plays.push(play);
		return play;
	}

	async countByReference(reference: string): Promise<number> {
		return this.plays.filter((p) => p.reference === reference).length;
	}

	async byReference(reference: string): Promise<MachinePlay[]> {
		return this.plays.filter((p) => p.reference === reference);
	}

	async countByDocumentRaffle(
		documentNumber: string,
		raffleId: string,
	): Promise<number> {
		return this.plays.filter(
			(p) => p.documentNumber === documentNumber && p.raffleId === raffleId,
		).length;
	}

	async byDocumentRaffle(
		documentNumber: string,
		raffleId: string,
	): Promise<MachinePlay[]> {
		return this.plays.filter(
			(p) => p.documentNumber === documentNumber && p.raffleId === raffleId,
		);
	}

	async findById(id: string): Promise<MachinePlay | null> {
		return this.plays.find((p) => p.id === id) ?? null;
	}

	async updateDelivered(id: string): Promise<MachinePlay | null> {
		return this.plays.find((p) => p.id === id) ?? null;
	}

	async list(): Promise<{ plays: MachinePlay[]; total: number }> {
		return { plays: this.plays, total: this.plays.length };
	}
}

class MockGrantRepo {
	grants: MachineGrant[] = [];

	async save(grant: MachineGrant): Promise<MachineGrant> {
		this.grants.push(grant);
		return grant;
	}

	async byDocumentRaffle(
		documentNumber: string,
		raffleId: string,
	): Promise<MachineGrant[]> {
		return this.grants.filter(
			(g) => g.documentNumber === documentNumber && g.raffleId === raffleId,
		);
	}

	async list(): Promise<MachineGrant[]> {
		return this.grants;
	}
}

function baseRaffle(overrides: Partial<RafflePayload> = {}): RafflePayload {
	return {
		id: "raffle-1",
		title: "Sorteo prueba",
		status: "active",
		ticketPrice: 1000,
		maxTickets: 100,
		prizes: [{ type: "seco1", name: "Cafetera" }],
		machine: {
			prizes: [{ kind: "seco", prizeType: "seco1", winRate: 0 }],
		},
		...overrides,
	};
}

function paidIntent(overrides: Partial<GatewayIntent> = {}): GatewayIntent {
	return {
		reference: "ref-1",
		gateway: "wompi",
		mode: "widget",
		purchaseId: "purchase-1",
		ticketIds: ["ticket-1"],
		raffleId: "raffle-1",
		buyerDocumentNumber: "1061789331",
		amountInCents: 500000,
		currency: "COP",
		status: "pagada",
		plays: 3,
		...overrides,
	};
}

function randomAt(value: number): () => void {
	const original = Math.random;
	Math.random = () => value;
	return () => {
		Math.random = original;
	};
}

function makePlayByDocument(options: {
	intents?: GatewayIntent[];
	grants?: MachineGrant[];
	raffle?: RafflePayload | null;
}): {
	useCase: PlayMachineByDocument;
	playRepo: MockPlayRepo;
} {
	const intentRepo = new MockIntentRepo();
	intentRepo.paid = options.intents ?? [paidIntent()];
	const grantRepo = new MockGrantRepo();
	grantRepo.grants = options.grants ?? [];
	const raffleService = new MockRaffleService(
		options.raffle === undefined ? baseRaffle() : options.raffle,
	);
	const playRepo = new MockPlayRepo();
	const useCase = new PlayMachineByDocument(
		intentRepo as never,
		new MockTicketRepo() as never,
		raffleService as unknown as IRaffleService,
		new MockRaffleRepo() as never,
		playRepo as never,
		grantRepo as never,
		settings,
		noopLogger,
	);
	return { useCase, playRepo };
}

describe("PlayMachineByDocument", () => {
	it("consume una compra pagada por documento", async () => {
		const restore = randomAt(0.999);
		try {
			const { useCase, playRepo } = makePlayByDocument({});
			const result = await useCase.execute("1061789331", "raffle-1");

			assert.equal(result.playsRemaining, 2);
			assert.equal(playRepo.plays.length, 1);
			assert.equal(playRepo.plays[0]?.reference, "ref-1");
			assert.equal(playRepo.plays[0]?.documentNumber, "1061789331");
			assert.equal(playRepo.plays[0]?.playedIndex, 1);
		} finally {
			restore();
		}
	});

	it("usa un crédito sintético cuando las compras se agotaron", async () => {
		const restore = randomAt(0.999);
		try {
			const { useCase, playRepo } = makePlayByDocument({
				grants: [
					{
						id: "grant-1",
						documentNumber: "1061789331",
						raffleId: "raffle-1",
						delta: 2,
					},
				],
			});
			playRepo.plays = [
				{
					id: "p1",
					raffleId: "raffle-1",
					purchaseId: "purchase-1",
					reference: "ref-1",
					documentNumber: "1061789331",
					playedIndex: 1,
					result: { won: false },
				},
				{
					id: "p2",
					raffleId: "raffle-1",
					purchaseId: "purchase-1",
					reference: "ref-1",
					documentNumber: "1061789331",
					playedIndex: 2,
					result: { won: false },
				},
				{
					id: "p3",
					raffleId: "raffle-1",
					purchaseId: "purchase-1",
					reference: "ref-1",
					documentNumber: "1061789331",
					playedIndex: 3,
					result: { won: false },
				},
			];

			const result = await useCase.execute("1061789331", "raffle-1");

			assert.equal(playRepo.plays.length, 4);
			assert.equal(playRepo.plays[3]?.reference, "credit:grant-1");
			assert.equal(playRepo.plays[3]?.playedIndex, 1);
			assert.equal(result.playsRemaining, 1);
		} finally {
			restore();
		}
	});

	it("lanza error cuando no hay tiros disponibles", async () => {
		const restore = randomAt(0.999);
		try {
			const { useCase } = makePlayByDocument({ intents: [] });
			await assert.rejects(
				() => useCase.execute("1061789331", "raffle-1"),
				MachineNoPlaysError,
			);
		} finally {
			restore();
		}
	});
});

describe("GetDocumentMachineOverview", () => {
	it("suma compras y créditos y calcula los restantes", async () => {
		const intentRepo = new MockIntentRepo();
		intentRepo.paid = [paidIntent({ plays: 3 })];
		const grantRepo = new MockGrantRepo();
		grantRepo.grants = [
			{
				id: "grant-1",
				documentNumber: "1061789331",
				raffleId: "raffle-1",
				delta: 5,
			},
		];
		const playRepo = new MockPlayRepo();
		playRepo.plays = [
			{
				id: "p1",
				raffleId: "raffle-1",
				purchaseId: "purchase-1",
				reference: "ref-1",
				documentNumber: "1061789331",
				playedIndex: 1,
				result: { won: false },
			},
		];

		const useCase = new GetDocumentMachineOverview(
			intentRepo as never,
			new MockTicketRepo() as never,
			new MockRaffleService(baseRaffle()) as unknown as IRaffleService,
			playRepo as never,
			grantRepo as never,
			settings,
		);

		const result = await useCase.execute("1061789331");

		assert.equal(result.entries.length, 1);
		assert.equal(result.entries[0]?.raffleId, "raffle-1");
		assert.equal(result.entries[0]?.playsGranted, 8);
		assert.equal(result.entries[0]?.playsUsed, 1);
		assert.equal(result.entries[0]?.playsRemaining, 7);
		assert.equal(result.entries[0]?.enabled, true);
	});
});
