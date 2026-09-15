import assert from "node:assert";
import { describe, it } from "node:test";
import { pickConsecutiveFreeNumbers } from "../pickConsecutiveFreeNumbers.js";

describe("pickConsecutiveFreeNumbers", () => {
	it("debería devolver los primeros números libres", () => {
		assert.deepEqual(pickConsecutiveFreeNumbers(new Set(), 5, 3), [1, 2, 3]);
	});

	it("debería saltarse los números ya asignados", () => {
		assert.deepEqual(
			pickConsecutiveFreeNumbers(new Set([1, 3]), 5, 2),
			[2, 4],
		);
	});

	it("debería respetar el límite maxNumber", () => {
		assert.deepEqual(
			pickConsecutiveFreeNumbers(new Set([1, 2]), 5, 10),
			[3, 4, 5],
		);
	});

	it("debería devolver vacío si no hay libres", () => {
		assert.deepEqual(
			pickConsecutiveFreeNumbers(new Set([1, 2, 3]), 3, 1),
			[],
		);
	});

	it("debería rellenar huecos de números liberados", () => {
		assert.deepEqual(
			pickConsecutiveFreeNumbers(new Set([2, 4]), 4, 3),
			[1, 3],
		);
	});
});