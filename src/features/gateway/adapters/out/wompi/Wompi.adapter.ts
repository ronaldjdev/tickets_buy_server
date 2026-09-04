import type { IHttpClient } from "@/shared/port/IHttpClient.port.js";
import type {
	CreateWompiLinkInput,
	IWompiPort,
	WompiEventPayload,
	WompiEventTransaction,
	WompiLinkData,
} from "@/shared/port/IWompi.port.js";

import {
	computeEventChecksum,
	WOMPI_BASE_URLS,
} from "./WompiSignature.utils.js";

export type WompiEnvironmentProvider = () => Promise<"test" | "prod">;

interface WompiLinkResponse {
	data?: { id?: string };
}

interface WompiTransactionResponse {
	data?: WompiEventTransaction;
}

interface WompiTransactionsListResponse {
	data?: WompiEventTransaction[];
}

export class WompiAdapter implements IWompiPort {
	constructor(
		private readonly httpClient: IHttpClient,
		private readonly getEnvironment?: WompiEnvironmentProvider,
	) {}

	private async baseUrl(): Promise<string> {
		if (!this.getEnvironment) return WOMPI_BASE_URLS.test;
		const env = await this.getEnvironment();
		return WOMPI_BASE_URLS[env] ?? WOMPI_BASE_URLS.test;
	}

	async createPaymentLink(
		input: CreateWompiLinkInput,
		privateKey: string,
	): Promise<WompiLinkData> {
		const body: Record<string, unknown> = {
			name: input.name,
			description: input.description ?? "",
			single_use: input.singleUse ?? true,
			collect_shipping: false,
			currency: "COP",
			amount_in_cents: input.amountInCents,
		};
		if (input.expiresAt) body.expires_at = input.expiresAt.toISOString();
		if (input.sku) body.sku = input.sku;

		const res = await this.httpClient.post<unknown>(
			`${await this.baseUrl()}/payment_links`,
			body,
			{
				headers: { Authorization: `Bearer ${privateKey}` },
			},
		);

		const data = res as WompiLinkResponse;
		const id = data?.data?.id;
		if (!id) {
			throw new Error("Wompi no devolvió el identificador del enlace de pago");
		}

		return {
			id,
			url: `${(await this.baseUrl()).replace("/v1", "")}/l/${id}`,
		};
	}

	verifyEventChecksum(payload: WompiEventPayload, eventsKey: string): boolean {
		if (!payload?.signature?.checksum || !payload.timestamp) return false;
		try {
			const computed = computeEventChecksum(payload, eventsKey);
			return computed === payload.signature.checksum.toUpperCase();
		} catch {
			return false;
		}
	}

	async getTransaction(
		transactionId: string,
		privateKey: string,
	): Promise<WompiEventTransaction | null> {
		const auth = { headers: { Authorization: `Bearer ${privateKey}` } };
		try {
			const res = await this.httpClient.get<WompiTransactionResponse>(
				`${await this.baseUrl()}/transactions/${transactionId}`,
				auth,
			);
			return res?.data ?? null;
		} catch {
			return null;
		}
	}

	async getLinkTransactions(
		linkId: string,
		privateKey: string,
	): Promise<WompiEventTransaction[]> {
		const auth = { headers: { Authorization: `Bearer ${privateKey}` } };
		try {
			const res = await this.httpClient.get<
				WompiTransactionsListResponse | WompiEventTransaction[]
			>(`${await this.baseUrl()}/payment_links/${linkId}/transactions`, auth);
			if (Array.isArray(res)) return res;
			return (res as WompiTransactionsListResponse)?.data ?? [];
		} catch {
			return [];
		}
	}
}
