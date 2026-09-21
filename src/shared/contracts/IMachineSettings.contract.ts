/** Lectura/escritura del interruptor global de la máquina de tiros. */
export interface IMachineSettings {
	isEnabled(): Promise<boolean>;
	setEnabled(enabled: boolean): Promise<void>;
}
