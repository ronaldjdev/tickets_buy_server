export interface IEmailPort {
	send(to: string, subject: string, html: string): Promise<any>;
}
