import type { PaymentFrequency } from "@/shared/types/types.js";

/**
 * Calcula la nueva fecha para un pago recurrente según la frecuencia especificada.
 * @param current Fecha actual del pago.
 * @param frecuency Frecuencia del pago. Valores posibles: "semanal", "quincenal" o "mensual".
 * @return La nueva fecha calculada.
 */
const newDateCalculator = (current: Date, frecuency: PaymentFrequency) => {
	const date = current;
	switch (frecuency) {
		case "diario":
			date.setDate(date.getDate() + 1);
			break;
		case "semanal":
			date.setDate(date.getDate() + 7);
			break;
		case "quincenal":
			date.setDate(date.getDate() + 15);
			break;
		case "mensual":
			date.setMonth(date.getMonth() + 1);
			break;
	}

	return date;
};

export default newDateCalculator;
