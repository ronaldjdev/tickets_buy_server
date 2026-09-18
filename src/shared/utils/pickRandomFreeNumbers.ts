export function pickRandomFreeNumbers(
	existing: ReadonlySet<number>,
	maxNumber: number,
	count: number,
	excluded: ReadonlySet<number> = new Set(),
	maxAttempts = 5000,
): number[] {
	const picked = new Set<number>();
	let attempts = 0;
	while (picked.size < count && attempts < maxAttempts) {
		attempts += 1;
		const remaining = maxNumber - existing.size - excluded.size - picked.size;
		if (remaining <= 0) break;
		const candidate = 1 + Math.floor(Math.random() * maxNumber);
		if (
			!existing.has(candidate) &&
			!excluded.has(candidate) &&
			!picked.has(candidate)
		) {
			picked.add(candidate);
		}
	}
	return [...picked];
}
