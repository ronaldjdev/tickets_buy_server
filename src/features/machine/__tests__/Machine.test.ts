import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	IRaffleService,
	MachinePrizeConfigPayload,
	RafflePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../shared/errors/UseCaseError.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import type { GatewayIntent } from "../../gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "../../gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IRaffleRepository } from "../../raffle/domain/repositories/IRaffle.repository.js";
import type { Ticket } from "../../ticket/domain/entities/Ticket.entity.js";
import type { ITicketRepository } from "../../ticket/domain/repositories/ITicket.repository.js";
import { PlayMachine } from "../application/use-cases/PlayMachine.uc.js";
import type { MachinePlay } from "../domain/entities/MachinePlay.entity.js";
import { MachineNoPlaysError } from "../domain/errors/Machine.error.js";
import type { IMachinePlayRepository } from "../domain/repositories/IMachinePlay.repository.js";

const noopLogger = createNoopLogger();

class MockIntentRepo
	implements Pick<IGatewayIntentRepository, "findByReference">
{
	intent: GatewayIntent | null;

	constructor(intent: GatewayIntent | null) {
		this.intent = intent;
	}

	async findByReference(): Promise<GatewayIntent | null> {
		return this.intent;
	}
}

class MockTicketRepo implements Pick<ITicketRepository, "findByIds"> {
	raffleId: string | undefined;

	constructor(raffleId?: string) {
		this.raffleId = raffleId;
	}

	async findByIds(): Promise<Ticket[]> {
		return this.raffleId
			? [
					{
						id: "ticket-1",
						raffleId: this.raffleId,
						number: 1,
						status: "purchased",
					} satisfies Ticket,
				]
			: [];
	}
}

class MockRaffleService implements Pick<IRaffleService, "findById"> {
	raffle: RafflePayload | null;

	constructor(raffle: RafflePayload | null) {
		this.raffle = raffle;
	}

	async findById(): Promise<RafflePayload | null> {
		return this.raffle;
	}
}

class MockRaffleRepo
	implements
		Pick<
			IRaffleRepository,
			"claimMachineSecoPrize" | "decrementMachineInstantStock"
		>
{
	instantStock: number;
	secoClaimed: boolean;
	claims: number;
	decrements: number;

	constructor(options: { secoClaimed?: boolean; instantStock?: number } = {}) {
		this.secoClaimed = options.secoClaimed ?? false;
		this.instantStock = options.instantStock ?? 5;
		this.claims = 0;
		this.decrements = 0;
	}

	async claimMachineSecoPrize(): Promise<boolean> {
		if (this.secoClaimed) return false;
		this.secoClaimed = true;
		this.claims += 1;
		return true;
	}

	async decrementMachineInstantStock(): Promise<boolean> {
		if (this.instantStock <= 0) return false;
		this.instantStock -= 1;
		this.decrements += 1;
		return true;
	}
}

class MockPlayRepo
	implements
		Pick<IMachinePlayRepository, "save" | "countByReference" | "byReference">
{
	plays: MachinePlay[] = [];

	async save(play: MachinePlay): Promise<MachinePlay | null> {
		this.plays.push(play);
		return play;
	}

	async countByReference(): Promise<number> {
		return this.plays.length;
	}

	async byReference(): Promise<MachinePlay[]> {
		return [...this.plays].reverse();
	}
}

function baseRaffle(machine: MachinePrizeConfigPayload[]): RafflePayload {
	return {
		id: "raffle-1",
		title: "Sorteo prueba",
		status: "active",
		ticketPrice: 1000,
		maxTickets: 100,
		prizes: [
			{ type: "seco1", name: "Cafetera", description: "240ml" },
			{ type: "seco2", name: "Audífonos" },
		],
		machine: { prizes: machine },
	};
}

function baseIntent(overrides: Partial<GatewayIntent> = {}): GatewayIntent {
	return {
		reference: "ref-123",
		gateway: "wompi",
		mode: "widget",
		purchaseId: "purchase-1",
		ticketIds: ["ticket-1"],
		raffleId: "raffle-1",
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

function createPlayMachine(
	options: {
		intent?: GatewayIntent;
		raffle?: RafflePayload | null;
		raffleRepo?: MockRaffleRepo;
		raffleId?: string;
	} = {},
): {
	playMachine: PlayMachine;
	playRepo: MockPlayRepo;
	raffleRepo: MockRaffleRepo;
} {
	const intentRepo = new MockIntentRepo(
		options.intent === undefined ? baseIntent() : options.intent,
	);
	const ticketRepo = new MockTicketRepo(options.raffleId ?? "raffle-1");
	const raffleService = new MockRaffleService(
		options.raffle ??
			baseRaffle([
				{
					kind: "instant",
					id: "bonus",
					name: "Bono $20.000",
					stock: 5,
					winRate: 30,
				},
			]),
	);
	const raffleRepo = options.raffleRepo ?? new MockRaffleRepo();
	const playRepo = new MockPlayRepo();
	const playMachine = new PlayMachine(
		intentRepo as unknown as IGatewayIntentRepository,
		ticketRepo as unknown as ITicketRepository,
		raffleService as unknown as IRaffleService,
		raffleRepo as unknown as IRaffleRepository,
		playRepo as unknown as IMachinePlayRepository,
		noopLogger,
	);
	return { playMachine, playRepo, raffleRepo };
}

describe("PlayMachine", () => {
	it("lanza error si la compra no existe", async () => {
		const { playMachine } = createPlayMachine({
			intent: null as unknown as GatewayIntent,
		});
		await assert.rejects(() => playMachine.execute("ref-x"), UseCaseError);
	});

	it("lanza error si la compra no está pagada", async () => {
		const { playMachine } = createPlayMachine({
			intent: baseIntent({ status: "creada" }),
		});
		await assert.rejects(() => playMachine.execute("ref-123"), UseCaseError);
	});

	it("lanza error si la compra no incluye tiros", async () => {
		const { playMachine } = createPlayMachine({
			intent: baseIntent({ plays: 0 }),
		});
		await assert.rejects(() => playMachine.execute("ref-123"), UseCaseError);
	});

	it("gana un premio instantáneo, decrementa stock y registra el tiro", async () => {
		const restore = randomAt(0.005);
		try {
			const { playMachine, playRepo, raffleRepo } = createPlayMachine({
				raffle: baseRaffle([
					{
						kind: "instant",
						id: "bonus",
						name: "Bono $20.000",
						stock: 5,
						winRate: 30,
					},
				]),
			});
			const result = await playMachine.execute("ref-123");

			assert.equal(result.play.result.won, true);
			if (result.play.result.won) {
				assert.equal(result.play.result.prize.kind, "instant");
			}
			assert.equal(result.playsRemaining, 2);
			assert.equal(playRepo.plays.length, 1);
			assert.equal(raffleRepo.decrements, 1);
		} finally {
			restore();
		}
	});

	it("no gana cuando el premio instantáneo está sin stock", async () => {
		const restore = randomAt(0.005);
		try {
			const { playMachine, playRepo, raffleRepo } = createPlayMachine({
				raffle: baseRaffle([
					{
						kind: "instant",
						id: "bonus",
						name: "Bono $20.000",
						stock: 0,
						winRate: 100,
					},
				]),
			});
			const result = await playMachine.execute("ref-123");

			assert.equal(result.play.result.won, false);
			assert.equal(playRepo.plays.length, 1);
			assert.equal(raffleRepo.decrements, 0);
		} finally {
			restore();
		}
	});

	it("no juega un premio seco ya reclamado", async () => {
		const restore = randomAt(0.005);
		try {
			const raffle = baseRaffle([
				{ kind: "seco", prizeType: "seco1", winRate: 100 },
			]);
			raffle.prizes = [
				{
					type: "seco1",
					name: "Cafetera",
					machineClaimedAt: "2026-09-19T00:00:00.000Z",
					machineClaimedByPurchaseId: "other",
				},
			];
			const { playMachine, playRepo } = createPlayMachine({ raffle });

			const result = await playMachine.execute("ref-123");
			assert.equal(result.play.result.won, false);
			assert.equal(playRepo.plays.length, 1);
		} finally {
			restore();
		}
	});

	it("lanza error cuando ya se gastaron todos los tiros", async () => {
		const { playMachine, playRepo } = createPlayMachine();
		playRepo.plays = [
			{
				id: "p1",
				raffleId: "raffle-1",
				purchaseId: "purchase-1",
				reference: "ref-123",
				playedIndex: 1,
				result: { won: false },
			},
			{
				id: "p2",
				raffleId: "raffle-1",
				purchaseId: "purchase-1",
				reference: "ref-123",
				playedIndex: 2,
				result: { won: false },
			},
			{
				id: "p3",
				raffleId: "raffle-1",
				purchaseId: "purchase-1",
				reference: "ref-123",
				playedIndex: 3,
				result: { won: false },
			},
		];
		await assert.rejects(
			() => playMachine.execute("ref-123"),
			MachineNoPlaysError,
		);
	});
});
