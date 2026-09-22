/** Construye un CSV RFC-4180 con salto de línea CRLF y BOM UTF-8
 *  para que Excel/Sheets abran acentos y caracteres especiales bien. */
export function toCsv(
	headers: string[],
	rows: Array<Array<CellValue>>,
): string {
	const serialize = (value: CellValue): string => {
		const text = value === null || value === undefined ? "" : String(value);
		if (/[",\r\n]/.test(text)) {
			return `"${text.replaceAll('"', '""')}"`;
		}
		return text;
	};

	const lines = [headers.map(serialize).join(",")];
	for (const row of rows) {
		lines.push(row.map(serialize).join(","));
	}
	return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export type CellValue = string | number | null | undefined;
