export class MachineError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MachineError";
	}
}

export class NoMachineConfiguredError extends MachineError {
	constructor() {
		super("Esta rifa aún no tiene premios configurados en la máquina.");
	}
}

export class MachineNoPlaysError extends MachineError {
	constructor() {
		super("No te quedan tiros disponibles.");
	}
}

export class MachineDisabledError extends MachineError {
	constructor() {
		super("La máquina de tiros está desactivada por ahora.");
	}
}

export class MachinePrizeNotFoundError extends MachineError {
	constructor() {
		super("El premio indicado no existe en la máquina.");
	}
}

export class MachinePlayNotFoundError extends MachineError {
	constructor() {
		super("El tiro indicado no existe.");
	}
}
