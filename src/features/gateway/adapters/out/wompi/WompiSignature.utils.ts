import { createHash } from "node:crypto";

import type { WompiEventPayload } from "@/shared/port/IWompi.port.js";

export const WOMPI_BASE_URLS = {
	test: "https://sandbox.wompi.co/v1",
	prod: "https://production.wompi.co/v1",
} as const;

export function buildIntegritySignature(
	reference: string,
	amountInCents: number,
	currency: string,
	integrityKey: string,
): string {
	const concat = `${reference}${amountInCents}${currency}${integrityKey}`;
	return createHash("sha256").update(concat).digest("hex");
}

export function resolvePropertyValues(
	payload: WompiEventPayload,
	properties: string[],
): string[] {
	return properties.map((prop) => {
		const value = prop.split(".").reduce<unknown>((acc, key) => {
			if (acc && typeof acc === "object" && key in acc) {
				return (acc as Record<string, unknown>)[key];
			}
			return undefined;
		}, payload.data);
		return String(value);
	});
}

export function computeEventChecksum(
	payload: WompiEventPayload,
	eventsKey: string,
): string {
	const values = resolvePropertyValues(
		payload,
		payload.signature?.properties ?? [],
	);
	const concat = [...values, String(payload.timestamp), eventsKey].join("");
	return createHash("sha256").update(concat).digest("hex").toUpperCase();
}
