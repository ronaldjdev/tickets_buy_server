export function normalizePhone(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	if (digits.startsWith("57")) return digits;
	return `57${digits}`;
}
