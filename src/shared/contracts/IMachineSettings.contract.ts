/** Lectura/escritura del interruptor global y la regla de tiros de la máquina. */
export interface MachinePlaysRule {
	/** Cantidad de boletos para otorgar `plays` tiros. */
	every: number;
	/** Tiros otorgados por cada `every` boletos. */
	plays: number;
}

export interface IMachineSettings {
	isEnabled(): Promise<boolean>;
	setEnabled(enabled: boolean): Promise<void>;
	/** Regla global "por cada X boletos, Y tiros"; null = sin regla configurada. */
	getPlaysRule(): Promise<MachinePlaysRule | null>;
	setPlaysRule(rule: MachinePlaysRule | null): Promise<void>;
}
