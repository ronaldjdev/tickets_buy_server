import type { NextFunction, Request, Response } from "express";
import logger from "../../../../../../platform/logger/index.js";
import { ValidationError } from "../../../../../../shared/errors/ValidationError.js";
import type { ListQueryDTO } from "../../../../../../shared/http/Common.dto.js";
import response from "../../../../../../shared/http/Response.utils.js";
import type { DocumentType } from "../../../../../../shared/types/types.js";
import { toCsv } from "../../../../../../shared/utils/toCsv.js";
import type {
	CreateContact,
	DeleteContact,
	ExportContacts,
	GetContact,
	ListContacts,
	UpdateContact,
} from "../../../../application/use-cases/index.js";
import type { CreateContactDTO, UpdateContactDTO } from "../dto/contact.dto.js";

const STATUS_LABELS: Record<string, string> = {
	activo: "Activo",
	pendiente: "Pendiente",
	inactivo: "Inactivo",
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
	cc: "C.C.",
	ce: "C.E.",
	pasaporte: "Pasaporte",
};

function formatDate(value?: Date): string {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(value);
	return date.toISOString().slice(0, 10);
}

export class ContactController {
	constructor(
		private readonly createContact: CreateContact,
		private readonly getContact: GetContact,
		private readonly listContacts: ListContacts,
		private readonly updateContact: UpdateContact,
		private readonly deleteContact: DeleteContact,
		private readonly exportContacts: ExportContacts,
	) {}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = req.body as CreateContactDTO;
			if (!body) throw new ValidationError("Cuerpo de la solicitud vacío");
			const contact = await this.createContact.execute(body as any);
			logger.info("Contacto creado con éxito");
			response(res, 201, "Contacto creado", contact);
		} catch (error: any) {
			logger.error("Error al crear el contacto:", error);
			next(error);
		}
	};

	get = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			if (!id) throw new ValidationError("Cuerpo de la solicitud vacío");
			const contact = await this.getContact.execute(id);
			logger.info("Contacto obtenido con éxito");
			response(res, 200, "Contacto encontrado", contact);
		} catch (error: any) {
			logger.error("Error al obtener el contacto:", error);
			next(error);
		}
	};

	list = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { status, date } = req.query as unknown as ListQueryDTO;
			const pageNum = parseInt(String(req.query.page ?? "1"), 10);
			const limitNum = parseInt(String(req.query.limit ?? "10"), 10);
			if (Number.isNaN(pageNum) || pageNum < 1)
				throw new ValidationError("La pagina debe ser un numero mayor a 0");
			if (Number.isNaN(limitNum) || limitNum < 1)
				throw new ValidationError("El limite debe ser un numero mayor a 0");
			const options = {
				limit: limitNum,
				page: pageNum,
				date: date as string | undefined,
				status: status as string | undefined,
				q: String(req.query.q ?? "").trim() || undefined,
			};

			const { contacts, paginate } = await this.listContacts.execute(options);
			logger.info(`Contactos listados con éxito: ${paginate.total}`, {
				operation: "listar_contactos",
			});
			response(res, 200, "Contactos listados", { contacts, paginate });
		} catch (error: any) {
			logger.error("Error al listar los contactos:", error);
			next(error);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = req.body as UpdateContactDTO;
			const { id } = req.params;
			if (!id) throw new ValidationError("Faltan parámetros requeridos");
			if (!body) throw new ValidationError("Cuerpo de la solicitud vacío");
			const contact = await this.updateContact.execute(id, body);
			logger.info("Contacto actualizado con éxito");
			response(res, 200, "Contacto actualizado", contact);
		} catch (error: any) {
			logger.error("Error al actualizar el contacto:", error);
			next(error);
		}
	};

	delete = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			if (!id) throw new ValidationError("Faltan parámetros requeridos");
			await this.deleteContact.execute(id);
			logger.info("Contacto eliminado con éxito:", { id });
			response(res, 200, "Contacto eliminado");
		} catch (error: any) {
			logger.error("Error al eliminar el contacto:", error);
			next(error);
		}
	};

	exportCsv = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const contacts = await this.exportContacts.execute();
			const headers = [
				"ID",
				"Nombre",
				"Apellido",
				"Correo",
				"Teléfono",
				"Tipo de documento",
				"Documento",
				"País",
				"Dirección",
				"Estado",
				"Fecha de alta",
			];
			const rows = contacts.map((contact) => [
				contact.id,
				contact.name,
				contact.lastName ?? "",
				contact.email ?? "",
				contact.phone,
				contact.documentType
					? (DOCUMENT_TYPE_LABELS[contact.documentType] ?? contact.documentType)
					: "",
				contact.documentNumber ?? "",
				contact.country ?? "",
				contact.address ?? "",
				STATUS_LABELS[contact.status] ?? contact.status,
				formatDate(contact.createdAt),
			]);

			const date = new Date().toISOString().slice(0, 10);
			res.setHeader("Content-Type", "text/csv; charset=utf-8");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="contactos_${date}.csv"`,
			);
			res.send(toCsv(headers, rows));
			logger.info(`Contactos exportados: ${contacts.length}`, {
				operation: "exportar_contactos",
			});
		} catch (error: any) {
			logger.error("Error al exportar los contactos:", error);
			next(error);
		}
	};
}
