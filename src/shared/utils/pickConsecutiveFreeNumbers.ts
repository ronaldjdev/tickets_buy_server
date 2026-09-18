export function pickConsecutiveFreeNumbers(
	existing: ReadonlySet<number>,
	maxNumber: number,
	count: number,
	excluded: ReadonlySet<number> = new Set(),
): number[] {
	const picked: number[] = [];
	for (let n = 1; n <= maxNumber && picked.length < count; n += 1) {
		if (!existing.has(n) && !excluded.has(n)) picked.push(n);
	}
	return picked;
}
