export interface IWhatsAppTextSender {
	send(to: string, message: string): Promise<void>;
}
