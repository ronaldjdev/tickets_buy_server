export interface UserReaderData {
	userId: string;
	notificationPreferences?: {
		toast?: boolean;
		push?: boolean;
		email?: boolean;
	};
}

export interface IUserReader {
	findActive(): Promise<UserReaderData[]>;
}
