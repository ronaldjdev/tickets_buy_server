export type NotificationType =
	| "payment_reminder"
	| "credit_approved"
	| "credit_rejected"
	| "payment_received"
	| "system"
	| "task"
	| "message";

export interface AppNotification {
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
