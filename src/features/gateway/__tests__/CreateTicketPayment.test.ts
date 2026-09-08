import assert from "node:assert";
import { describe, it } from "node:test";
import type {
	IWompiConfigReader,
	WompiSettings,
} from "../../../shared/contracts/IWompiConfigReader.contract.js";
import type {
	CreateWompiLinkInput,
	IWompiPort,
	WompiLinkData,
} from "../../../shared/port/IWompi.port.js";
import { CreateTicketPayment } from "../application/use-cases/CreateTicketPayment.uc.js";
import type { GatewayIntent } from "../domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "../domain/repositories/IGatewayIntent.repository.js";

class MockConfigReader implements IWompiConfigReader {
	constructor(private readonly settings: WompiSettings | null) {}
	async getWompiSettings(): Promise<WompiSettings | null> {
		return this.settings;
	}
}

class MockWompiPort implements IWompiPort {
	lastInput?: CreateWompiLinkInput;
	links: WompiLinkData[] = [];

	async createPaymentLink(input: CreateWompiLinkInput): Promise<WompiLinkData> {
		this.lastInput = input;
		return { id: "link-1", url: "https://checkout.wompi.co/l/link-1" };
	}

	verifyEventChecksum(): boolean {
		return true;
	}

	async getTransaction(): Promise<null> {
		return null;
	}

	async getLinkTransactions(): Promise<never[]> {
		return [];
	}
}

class MockIntentRepo implements IGatewayIntentRepository {
	created: GatewayIntent[] = [];
	updated: Array<{ reference: string; data: Partial<GatewayIntent> }> = [];

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

	async updateByReference(
		reference: string,
		data: Partial<GatewayIntent>,
	): Promise<GatewayIntent | null> {
		this.updated.push({ reference, data });
		return {
			reference,
			gateway: "wompi",
			mode: "link",
			purchaseId: "purchase-1",
			ticketIds: ["t1", "t2"],
			amountInCents: 2000,
			currency: "COP",
			status: "creada",
			checkoutUrl: data.checkoutUrl,
			linkId: data.linkId,
		};
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
	it("debería generar el link de pago y guardar el intent", async () => {
		const wompiPort = new MockWompiPort();
		const intentRepo = new MockIntentRepo();
		const useCase = new CreateTicketPayment(
			new MockConfigReader(settings),
			wompiPort,
			intentRepo,
			"https://frontend.com",
		);

		const result = await useCase.execute(makeInput());

		assert.ok(result.reference.startsWith("purchase-1-"));
		assert.equal(result.checkoutUrl, "https://checkout.wompi.co/l/link-1");
		assert.equal(result.amountInCents, 2000);
		assert.equal(intentRepo.created.length, 1);
		assert.equal(intentRepo.created[0].ticketIds.length, 2);
		assert.equal(wompiPort.lastInput?.amountInCents, 2000);
		assert.equal(
			wompiPort.lastInput?.redirectUrl,
			`https://frontend.com/pagar/${result.reference}`,
		);
	});

	it("debería fallar si Wompi no está habilitado", async () => {
		const useCase = new CreateTicketPayment(
			new MockConfigReader({ enabled: false }),
			new MockWompiPort(),
			new MockIntentRepo(),
		);

		await assert.rejects(
			() => useCase.execute(makeInput()),
			/Wompi no está habilitado/,
		);
	});

	it("debería fallar si el monto no es válido", async () => {
		const useCase = new CreateTicketPayment(
			new MockConfigReader(settings),
			new MockWompiPort(),
			new MockIntentRepo(),
		);

		await assert.rejects(() =>
			useCase.execute({ ...makeInput(), amountInCents: 0 }),
		);
	});
});
