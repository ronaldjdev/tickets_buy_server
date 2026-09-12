export async function ensureUniqueSlug(
	base: string,
	findExisting: (slug: string) => Promise<{ id: string } | null>,
	excludeId?: string,
): Promise<string> {
	const cleanBase = base.length > 0 ? base : "sorteo";
	let candidate = cleanBase;
	let counter = 2;

	while (counter < 1000) {
		const existing = await findExisting(candidate);
		if (!existing) return candidate;
		if (excludeId && existing.id === excludeId) return candidate;
		candidate = `${cleanBase}-${counter}`;
		counter += 1;
	}

	throw new Error("No se pudo generar un slug único");
}
