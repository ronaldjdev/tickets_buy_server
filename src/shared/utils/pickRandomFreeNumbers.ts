export function pickRandomFreeNumbers(
	existing: ReadonlySet<number>,
	maxNumber: number,
	count: number,
	maxAttempts = 5000,
): number[] {
	const picked = new Set<number>();
	let attempts = 0;
	while (picked.size < count && attempts < maxAttempts) {
		attempts += 1;
		if (maxNumber - existing.size - picked.size <= 0) break;
		const candidate = 1 + Math.floor(Math.random() * maxNumber);
		if (!existing.has(candidate) && !picked.has(candidate)) {
			picked.add(candidate);
		}
	}
	return [...picked];
}
