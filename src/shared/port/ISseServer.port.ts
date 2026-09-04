export interface ISseServer {
	addClient(userId: string, req: unknown, res: unknown): void;
	sendToUser(userId: string, event: string, data: unknown): void;
	broadcast(event: string, data: unknown): void;
	getConnectedCount(): number;
}
