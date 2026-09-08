export class ComboNotFoundError extends Error {
	constructor(id: string) {
		super(`Combo no encontrado: ${id}`);
		this.name = "ComboNotFoundError";
	}
}
