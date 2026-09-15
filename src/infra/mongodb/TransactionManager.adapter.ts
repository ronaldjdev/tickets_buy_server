import mongoose, { type ClientSession } from "mongoose";

import type {
	ITransaction,
	ITransactionManager,
} from "../../shared/port/ITransactionManager.port.js";

class MongooseTransaction implements ITransaction {
	constructor(readonly session: ClientSession) {}

	async startTransaction(): Promise<void> {
		this.session.startTransaction();
	}

	async commitTransaction(): Promise<void> {
		await this.session.commitTransaction();
	}

	async abortTransaction(): Promise<void> {
		await this.session.abortTransaction();
	}

	async endSession(): Promise<void> {
		await this.session.endSession();
	}
}

export class TransactionManager implements ITransactionManager {
	async startSession(): Promise<ITransaction> {
		const session = await mongoose.startSession();
		return new MongooseTransaction(session);
	}
}
