declare module "sse-channel" {
	export interface SseChannelOptions {
		jsonEncode?: boolean;
		pingInterval?: number;
		historySize?: number;
		[option: string]: unknown;
	}

	export interface SseClient {
		id?: string;
		[prop: string]: unknown;
	}

	export interface SendPayload {
		event: string;
		id?: string;
		retry?: number;
		data?: unknown;
		[prop: string]: unknown;
	}

	export default class SseChannel {
		constructor(options?: SseChannelOptions);
		addClient(req: unknown, res: unknown): SseClient;
		getClients(): SseClient[];
		getConnectionCount(): number;
		send(payload: SendPayload, clients?: SseClient[]): void;
		close(): void;
	}
}
