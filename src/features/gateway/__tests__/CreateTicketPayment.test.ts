import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	IWompiConfigReader,
	WompiSettings,
} from "../../../shared/contracts/IWompiConfigReader.contract.js";
import { createNoopLogger } from "../../../test/testLogger.js";
import { CreateTicketPayment } from "../application/use-cases/CreateTicketPayment.uc.js";
import type { GatewayIntent } from "../domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "../domain/repositories/IGatewayIntent.repository.js";

const noopLogger = createNoopLogger();

class MockConfigReader implements IWompiConfigReader {
	constructor(private readonly settings: WompiSettings | null) {}
	async getWompiSettings(): Promise<WompiSettings | null> {
		return this.settings;
	}
}

class MockIntentRepo implements IGatewayIntentRepository {
	created: GatewayIntent[] = [];

	async create(intent: Partial<GatewayIntent>): Promise<GatewayIntent> {
		const full = intent as GatewayIntent;
		this.created.push(full);
		return full;
	}

	async findByReference(): Promise<GatewayIntent | null> {
		return null;
	}

	async findByLinkId(): Promise<GatewayIntent | null> {
		return null;
	}

	async findPaidByContactId(): Promise<GatewayIntent[]> {
		return [];
	}

	async updateByReference(): Promise<GatewayIntent | null> {
		return null;
	}

	async list(): Promise<{ intents: GatewayIntent[]; total: number }> {
		return { intents: [], total: 0 };
	}
}

const settings: WompiSettings = {
	enabled: true,
	environment: "test",
	privateKey: "priv",
	publicKey: "pub",
	integrityKey: "integ",
};

function makeInput() {
	return {
		purchaseId: "purchase-1",
		ticketIds: ["t1", "t2"],
		contactId: "contact-1",
		contactName: "Ana",
		contactPhone: "3001234567",
		amountInCents: 2000,
	};
}

describe("CreateTicketPayment", () => {
	it("debería crear el intent en modo widget sin link de pago", async () => {
		const intentRepo = new MockIntentRepo();
		const useCase = new CreateTicketPayment(
			new MockConfigReader(settings),
			intentRepo,
			noopLogger,
			"https://frontend.com",
		);

		const result = await useCase.execute(makeInput());

		assert.ok(result.reference.startsWith("purchase-1-"));
		assert.equal(
			result.checkoutUrl,
			`https://frontend.com/pagar/${result.reference}`,
		);
		assert.equal(result.amountInCents, 2000);
		assert.equal(intentRepo.created.length, 1);
		assert.equal(intentRepo.created[0].ticketIds.length, 2);
		assert.equal(intentRepo.created[0].mode, "widget");
		assert.equal(intentRepo.created[0].linkId, undefined);
		assert.ok(intentRepo.created[0].expiresAt);
	});

	it("debería fallar si Wompi no está habilitado", async () => {
		const useCase = new CreateTicketPayment(
			new MockConfigReader({ enabled: false }),
			new MockIntentRepo(),
			noopLogger,
		);

		await assert.rejects(
			() => useCase.execute(makeInput()),
			/Wompi no está habilitado/,
		);
	});

	it("debería fallar si el monto no es válido", async () => {
		const useCase = new CreateTicketPayment(
			new MockConfigReader(settings),
			new MockIntentRepo(),
			noopLogger,
		);

		await assert.rejects(() =>
			useCase.execute({ ...makeInput(), amountInCents: 0 }),
		);
	});
});
