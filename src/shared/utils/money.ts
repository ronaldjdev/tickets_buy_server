import Big from "big.js";

export const MONEY = {
	add: (a: number, b: number): number => new Big(a).plus(b).toNumber(),
	sub: (a: number, b: number): number => new Big(a).minus(b).toNumber(),
	mul: (a: number, b: number): number => new Big(a).times(b).toNumber(),
	div: (a: number, b: number): number => new Big(a).div(b).toNumber(),
	pctOf: (value: number, pct: number): number =>
		new Big(value).times(pct).div(100).toNumber(),
	round: (value: number): number => Number(new Big(value).toFixed(0)),
	min: (a: number, b: number): number => (new Big(a).lte(b) ? a : b),
	max: (a: number, b: number): number => (new Big(a).gte(b) ? a : b),
	sum: (values: number[]): number =>
		values.reduce((total, v) => new Big(total).plus(v).toNumber(), 0),
	format: (value: number, locale = "es-CO"): string =>
		new Big(value)
			.toNumber()
			.toLocaleString(locale, { maximumFractionDigits: 0 }),
};
