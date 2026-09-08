export interface DashboardSummary {
	raffles: {
		total: number;
		active: number;
		draft: number;
		drawn: number;
	};
	tickets: {
		available: number;
		reserved: number;
		purchased: number;
		winner: number;
		sold: number;
	};
	revenue: {
		totalCents: number;
	};
	users: {
		total: number;
		active: number;
		pendiente: number;
	};
	contacts: {
		total: number;
	};
	payments: {
		total: number;
		creada: number;
		pagada: number;
		declinada: number;
		anulada: number;
		error: number;
	};
}

export interface SalesPoint {
	date: string;
	revenueCents: number;
	intents: number;
}

export interface RafflePerformance {
	raffleId: string;
	title: string;
	status: string;
	maxTickets: number;
	sold: number;
	available: number;
	fillRate: number;
	revenueCents: number;
}

export interface RecentPayment {
	reference: string;
	amountInCents: number;
	currency: string;
	customerEmail?: string | null;
	contactName?: string | null;
	paymentMethodType?: string | null;
	createdAt?: Date | null;
}

export interface DashboardStats {
	summary: DashboardSummary;
	salesByDay: SalesPoint[];
	rafflePerformance: RafflePerformance[];
	recentPayments: RecentPayment[];
}
