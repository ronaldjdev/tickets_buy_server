import type { IWhatsAppTextSender } from "@/features/gateway/application/use-cases/IWhatsAppTextSender.port.js";

interface SendMessageLike {
	execute(message: unknown): Promise<unknown>;
}

export class WhatsAppTextSender implements IWhatsAppTextSender {
	constructor(private readonly sendMessageUseCase: SendMessageLike) {}

	async send(to: string, message: string): Promise<void> {
		await this.sendMessageUseCase.execute({
			to,
			body: {
				phone: to,
				contactName: "",
				name: "",
				messageType: "freetext",
				message,
			},
			templateName: "",
		});
	}
}
