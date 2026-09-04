export interface ITransaction {
  session: unknown;
  startTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  abortTransaction(): Promise<void>;
  endSession(): Promise<void>;
}

export interface ITransactionManager {
  startSession(): Promise<ITransaction>;
}
