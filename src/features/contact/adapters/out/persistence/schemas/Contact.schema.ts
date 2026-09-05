import { type Document, model, Schema } from "mongoose";

import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";

interface IContact extends Document, Contact {
	guarantors: Schema.Types.ObjectId[];
}

const ContactSchema = new Schema<IContact>(
	{
		name: { type: String, required: true },
		documentType: { type: String },
		documentNumber: { type: String, sparse: true },
		email: { type: String },
		phone: { type: String, required: true },
		status: { type: String, default: "activo" },
		accountStatus: { type: String, default: "al_dia" },
		totalDebt: { type: Number, default: 0 },
		welcomedAt: { type: Date, default: null },
		guarantors: [{ type: Schema.Types.ObjectId, ref: "Guarantor" }],
	},
	{ timestamps: true },
);

// Índices para optimizar consultas de contactos
ContactSchema.index({ documentNumber: 1 }, { unique: true, sparse: true }); // Búsqueda por documento único
ContactSchema.index({ email: 1 }); // Búsqueda por email
ContactSchema.index({ phone: 1 }); // Búsqueda por teléfono
ContactSchema.index({ status: 1, accountStatus: 1 }); // Filtrar por estado y estado de cuenta
ContactSchema.index({ name: 1 }); // Búsqueda por nombre
ContactSchema.index({ totalDebt: -1 }); // Ordenar por deuda total

export default model<IContact>("Contact", ContactSchema);
