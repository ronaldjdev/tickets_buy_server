import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import logger from "../../platform/logger/index.js";
import type { ISocketServer } from "../../shared/port/ISocket.port.js";

export class SocketServer implements ISocketServer {
	private io: SocketIOServer | null = null;
	private httpServer: HttpServer | null = null;

	init(server: HttpServer, clientUrl: string) {
		this.httpServer = server;

		this.io = new SocketIOServer(server, {
			cors: {
				origin:
					process.env.NODE_ENV === "production"
						? [clientUrl, "http://localhost:3000"]
						: true,
				credentials: true,
			},
			transports: ["websocket", "polling"],
		});

		this.io.on("connection", (socket) => {
			logger.info(`[Socket] Cliente conectado: ${socket.id}`);

			socket.on("join_conversation", ({ conversationId }) => {
				if (!conversationId) return;
				socket.join(`conversation:${conversationId}`);
				logger.info(
					`[Socket] ${socket.id} se unió a conversation:${conversationId}`,
				);
			});

			socket.on("leave_conversation", ({ conversationId }) => {
				if (!conversationId) return;
				socket.leave(`conversation:${conversationId}`);
				logger.info(
					`[Socket] ${socket.id} salió de conversation:${conversationId}`,
				);
			});

			socket.on("disconnect", () => {
				logger.info(`[Socket] Cliente desconectado: ${socket.id}`);
			});
		});

		logger.info("[Socket] Socket.io inicializado");
	}

	emitToConversation(conversationId: string, event: string, data: unknown) {
		if (!this.io) return;
		this.io.to(`conversation:${conversationId}`).emit(event, data);
	}

	getHttpServer(): HttpServer {
		if (!this.httpServer) throw new Error("SocketServer no inicializado");
		return this.httpServer;
	}

	getIO(): SocketIOServer | null {
		return this.io;
	}
}
