export interface UserReaderData {
	userId: string;
}

export interface IUserReader {
	findActive(): Promise<UserReaderData[]>;
}
