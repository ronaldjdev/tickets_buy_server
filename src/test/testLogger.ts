import type { ILogger } from "../shared/port/ILogger.port.js";

export function createNoopLogger(): ILogger {
	return {
		info(): void {},
		warn(): void {},
		error(): void {},
		debug(): void {},
	};
}
