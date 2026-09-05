export interface GatewayCreditData {
	creditId: string;
	amount: number;
	amountPaid: number;
	installments: number;
	installmentValue: number;
	status: string;
	userId?: string;
	userName?: string;
}

export interface IGatewayCreditReader {
	findById(creditId: string): Promise<GatewayCreditData | null>;
}
