export interface ListNotificationsQueryDTO {
	page?: number;
	limit?: number;
	unreadOnly?: boolean;
}

export interface CreateNotificationDTO {
	userId: string;
	type:
		| "payment_received"
		| "sale_active"
		| "sale_drawn"
		| "stock_low"
		| "sold_out"
		| "system";
	title: string;
	message: string;
	link?: string;
	metadata?: Record<string, unknown>;
	read?: boolean;
}
