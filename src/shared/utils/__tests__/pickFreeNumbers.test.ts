import assert from "node:assert";
import { describe, it } from "node:test";
import { pickConsecutiveFreeNumbers } from "../pickConsecutiveFreeNumbers.js";
import { pickRandomFreeNumbers } from "../pickRandomFreeNumbers.js";

describe("pickConsecutiveFreeNumbers con excluded", () => {
	it("debería saltarse los números excluidos", () => {
		const excluded = new Set([2]);
		const result = pickConsecutiveFreeNumbers(new Set(), 5, 3, excluded);
		assert.deepEqual(result, [1, 3, 4]);
	});

	it("debería respetar excluded junto a existing", () => {
		const result = pickConsecutiveFreeNumbers(
			new Set([1, 5]),
			5,
			3,
			new Set([3]),
		);
		assert.deepEqual(result, [2, 4]);
	});

	it("debería devolver vacío si solo quedan excluidos", () => {
		const result = pickConsecutiveFreeNumbers(
			new Set(),
			3,
			2,
			new Set([1, 2, 3]),
		);
		assert.deepEqual(result, []);
	});
});

describe("pickRandomFreeNumbers con excluded", () => {
	it("debería nunca devolver un número excluido", () => {
		const excluded = new Set([1, 2, 3, 4, 5, 6, 7]);
		for (let i = 0; i < 200; i++) {
			const result = pickRandomFreeNumbers(new Set(), 10, 1, excluded);
			assert.ok(
				result.every((n) => !excluded.has(n)),
				`nunca devuelve excluido: ${result}`,
			);
		}
	});

	it("debería considerar excluidos en el pool disponible", () => {
		const result = pickRandomFreeNumbers(new Set(), 10, 3, new Set([1]));
		assert.equal(result.length, 3);
		assert.ok(!result.includes(1));
	});
});
