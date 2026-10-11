import assert from "node:assert";
import { describe, it } from "node:test";
import {
	validatePrizeSchedule,
	validatePrizes,
} from "../domain/entities/Raffle.entity.js";

describe("validatePrizeSchedule", () => {
	it("acepta el modo weekday con día válido", () => {
		assert.doesNotThrow(() =>
			validatePrizeSchedule({ mode: "weekday", weekday: 1 }),
		);
		assert.doesNotThrow(() =>
			validatePrizeSchedule({ mode: "weekday", weekday: 7 }),
		);
	});

	it("rechaza el modo weekday fuera de 1..7", () => {
		assert.throws(() => validatePrizeSchedule({ mode: "weekday", weekday: 0 }));
		assert.throws(() => validatePrizeSchedule({ mode: "weekday", weekday: 8 }));
		assert.throws(() =>
			validatePrizeSchedule({ mode: "weekday", weekday: 1.5 }),
		);
	});

	it("acepta el modo date con fecha válida", () => {
		assert.doesNotThrow(() =>
			validatePrizeSchedule({ mode: "date", date: "2026-12-31" }),
		);
	});

	it("rechaza fechas inválidas", () => {
		assert.throws(() => validatePrizeSchedule({ mode: "date", date: "" }));
		assert.throws(() =>
			validatePrizeSchedule({ mode: "date", date: "31-12-2026" }),
		);
		assert.throws(() =>
			validatePrizeSchedule({ mode: "date", date: "2026-13-01" }),
		);
		assert.throws(() =>
			validatePrizeSchedule({ mode: "date", date: "2026-02-30" }),
		);
	});

	it("rechaza modos desconocidos", () => {
		assert.throws(() => validatePrizeSchedule({ mode: "hourly" } as never));
	});
});

describe("validatePrizes", () => {
	it("permite schedule solo en premios secos", () => {
		assert.doesNotThrow(() =>
			validatePrizes([
				{
					type: "seco1",
					name: "Seco",
					schedule: { mode: "weekday", weekday: 5 },
				},
				{
					type: "seco2",
					name: "Seco 2",
					schedule: { mode: "date", date: "2026-09-30" },
				},
			]),
		);
	});

	it("rechaza schedule en el premio mayor", () => {
		assert.throws(() =>
			validatePrizes([
				{
					type: "mayor",
					name: "Mayor",
					schedule: { mode: "date", date: "2026-09-30" },
				},
			]),
		);
	});

	it("rechaza schedule inválido en un seco", () => {
		assert.throws(() =>
			validatePrizes([
				{
					type: "seco1",
					name: "Seco",
					schedule: { mode: "date", date: "mañana" },
				},
			]),
		);
	});

	it("acepta premios sin schedule (compat)", () => {
		assert.doesNotThrow(() =>
			validatePrizes([
				{ type: "mayor", name: "Mayor" },
				{ type: "seco1", name: "Seco" },
			]),
		);
		assert.doesNotThrow(() => validatePrizes(undefined));
	});

	it("acepta imageUrl en cualquier premio (mayor y secos)", () => {
		assert.doesNotThrow(() =>
			validatePrizes([
				{
					type: "mayor",
					name: "Mayor",
					imageUrl: "https://cdn.ejemplo.com/mayor.png",
				},
				{
					type: "seco1",
					name: "Seco",
					imageUrl: "https://cdn.ejemplo.com/seco.png",
				},
			]),
		);
	});

	it("rechaza imageUrl que no sea string", () => {
		assert.throws(() =>
			validatePrizes([
				{ type: "seco1", name: "Seco", imageUrl: 123 as never },
			]),
		);
	});
});
