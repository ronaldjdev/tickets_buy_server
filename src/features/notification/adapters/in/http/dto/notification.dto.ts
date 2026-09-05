export interface ListNotificationsQueryDTO {
	page?: number;
	limit?: number;
	unreadOnly?: boolean;
}

export interface CreateNotificationDTO {
	userId: string;
	type:
		| "payment_reminder"
		| "credit_approved"
		| "credit_rejected"
		| "payment_received"
		| "system"
		| "task"
		| "message";
	title: string;
	message: string;
	link?: string;
	metadata?: Record<string, unknown>;
	read?: boolean;
}
