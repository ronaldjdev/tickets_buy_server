export interface ISocketServer {
  emitToConversation(conversationId: string, event: string, data: unknown): void;
  getHttpServer(): import("http").Server;
}
