import type { Request, Response } from "express";
import SseChannel from "sse-channel";

export class SseServer {
  private channel = new SseChannel({
    jsonEncode: false,
    pingInterval: 30000,
    historySize: 10
  });

  private userClients: Map<string, Set<any>> = new Map();

  addClient(userId: string, req: Request, res: Response): void {
    res.setHeader("X-Accel-Buffering", "no");
    const client = this.channel.addClient(req, res);

    const clients = this.userClients.get(userId) || new Set();
    clients.add(client);
    this.userClients.set(userId, clients);

    res.on("close", () => {
      clients.delete(client);
      if (clients.size === 0) this.userClients.delete(userId);
    });
  }

  sendToUser(userId: string, event: string, data: any): void {
    const clients = this.userClients.get(userId);
    if (!clients || clients.size === 0) return;

    this.channel.send({ event, data: JSON.stringify(data) }, [...clients]);
  }

  broadcast(event: string, data: any): void {
    this.channel.send({ event, data: JSON.stringify(data) });
  }

  getConnectedCount(): number {
    return this.channel.getConnectionCount();
  }
}
