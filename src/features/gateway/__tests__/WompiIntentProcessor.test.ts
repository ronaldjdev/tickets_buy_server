import assert from "node:assert";
import { describe, it } from "node:test";
import type { IConfirmTicketPayment } from "../../../shared/contracts/IConfirmTicketPayment.contract.js";
import type { WompiEventTransaction } from "../../../shared/port/IWompi.port.js";
import { WompiIntentProcessor } from "../application/use-cases/shared/WompiIntentProcessor.js";
import type { GatewayIntent } from "../domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "../domain/repositories/IGatewayIntent.repository.js";

class MockIntentRepo implements IGatewayIntentRepository {
	updated: Array<{ reference: string; data: Partial<GatewayIntent> }> = [];

	async create(intent: Partial<GatewayIntent>): Promise<GatewayIntent> {
		return intent as GatewayIntent;
	}

	async findByReference(reference: string): Promise<GatewayIntent | null> {
		return null;
	}

	async findByLinkId(): Promise<GatewayIntent | null> {
		return null;
	}

	async updateByReference(
		reference: string,
		data: Partial<GatewayIntent>,
	): Promise<GatewayIntent | null> {
		this.updated.push({ reference, data });
		return data as GatewayIntent;
	}
}

class MockConfirm implements IConfirmTicketPayment {
	calls: Array<Record<string, unknown>> = [];

	async execute(input: Parameters<IConfirmTicketPayment["execute"]>[0]) {
		this.calls.push({ ...input });
		return {
			purchaseId: input.purchaseId,
			amount: input.amount,
			ticketCount: 2,
		};
	}
}

function makeIntent(): GatewayIntent {
	return {
		reference: "ref-1",
		gateway: "wompi",
		mode: "link",
		purchaseId: "purchase-1",
		ticketIds: ["t1", "t2"],
		contactId: "contact-1",
		contactName: "Ana",
		contactPhone: "3001234567",
		amountInCents: 2000,
		currency: "COP",
		status: "creada",
	};
}

function makeTransaction(
	overrides: Partial<WompiEventTransaction> = {},
): WompiEventTransaction {
	return {
		id: "txn-1",
		amount_in_cents: 2000,
		reference: "ref-1",
		customer_email: "ana@mail.com",
		currency: "COP",
		payment_method_type: "NEQUI",
		status: "APPROVED",
		...overrides,
	};
}

describe("WompiIntentProcessor", () => {
	it("debería actualizar el intent y confirmar la compra al aprobarse", async () => {
		const intentRepo = new MockIntentRepo();
		const confirm = new MockConfirm();
		const processor = new WompiIntentProcessor(intentRepo, confirm);

		const status = await processor.apply(makeIntent(), makeTransaction());

		assert.equal(status, "pagada");
		assert.equal(intentRepo.updated.length, 1);
		assert.equal(intentRepo.updated[0].data.status, "pagada");
		assert.equal(confirm.calls.length, 1);
		assert.equal(confirm.calls[0].purchaseId, "purchase-1");
		assert.equal(confirm.calls[0].method, "nequi");
		assert.equal(confirm.calls[0].gatewayTransactionId, "txn-1");
	});

	it("no debería confirmar la compra cuando el pago es rechazado", async () => {
		const intentRepo = new MockIntentRepo();
		const confirm = new MockConfirm();
		const processor = new WompiIntentProcessor(intentRepo, confirm);

		const status = await processor.apply(
			makeIntent(),
			makeTransaction({ status: "DECLINED" }),
		);

		assert.equal(status, "declinada");
		assert.equal(confirm.calls.length, 0);
	});
});
