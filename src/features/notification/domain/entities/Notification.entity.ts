export type NotificationType =
	| "payment_received"
	| "sale_active"
	| "sale_drawn"
	| "stock_low"
	| "sold_out"
	| "system";

export interface AppNotification {
	id?: string;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	read: boolean;
	link?: string;
	metadata?: Record<string, any>;
	createdAt?: Date;
	updatedAt?: Date;
}
