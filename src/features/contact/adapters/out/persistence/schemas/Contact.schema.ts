import { type Document, model, Schema } from "mongoose";

import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";

type IContact = Document & Contact;

const ContactSchema = new Schema<IContact>(
	{
		name: { type: String, required: true },
		lastName: { type: String },
		email: { type: String },
		phone: { type: String, required: true },
		documentType: {
			type: String,
			enum: ["cc", "ce", "pasaporte"],
		},
		documentNumber: { type: String },
		country: { type: String },
		address: { type: String },
		status: { type: String, default: "activo" },
		welcomedAt: { type: Date, default: null },
	},
	{ timestamps: true },
);

// Índices para optimizar consultas de contactos
ContactSchema.index({ email: 1 }); // Búsqueda por email
ContactSchema.index({ phone: 1 }); // Búsqueda por teléfono
ContactSchema.index({ status: 1 }); // Filtrar por estado
ContactSchema.index({ name: 1 }); // Búsqueda por nombre

export default model<IContact>("Contact", ContactSchema);
