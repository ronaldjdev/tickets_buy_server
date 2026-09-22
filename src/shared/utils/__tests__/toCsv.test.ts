import assert from "node:assert";
import { describe, it } from "node:test";
import { toCsv } from "../toCsv.js";

describe("toCsv", () => {
	it("debería prefijar BOM UTF-8 para Excel", () => {
		const csv = toCsv(["Nombre"], [["Ana"]]);
		assert.ok(csv.startsWith("\uFEFF"));
	});

	it("debería construir el encabezado y las filas", () => {
		const csv = toCsv(["Nombre", "Correo"], [["Ana", "ana@mail.com"]]);
		assert.equal(csv, "\uFEFFNombre,Correo\r\nAna,ana@mail.com\r\n");
	});

	it("debería escapar comas, comillas y saltos de línea", () => {
		const csv = toCsv(["Datos"], [['"hola", "mundo"']]);
		assert.ok(csv.includes('"""hola"", ""mundo"""'));
		assert.ok(!csv.includes('hola", "mundo"'));
	});

	it("debería convertir nulos y números a texto plano", () => {
		const csv = toCsv(["A", "B"], [[null, 123]]);
		assert.ok(csv.includes(",123\r\n"));
	});
});
