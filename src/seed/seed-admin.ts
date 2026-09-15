import "dotenv/config";

import { ObjectId } from "mongodb";

import db from "../infra/mongodb/Mongo.config.js";
import { initAuth } from "../platform/auth/auth.config.js";
import logger from "../platform/logger/index.js";

const adminEmail = (
	process.env.SEED_ADMIN_EMAIL ?? "admin@chevere.local"
).toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AdminChevere2026!";
const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";
const adminDocumentType = process.env.SEED_ADMIN_DOCUMENT_TYPE ?? "cc";
const adminDocumentNumber =
	process.env.SEED_ADMIN_DOCUMENT_NUMBER ?? "123456789";
const adminPhone = process.env.SEED_ADMIN_PHONE ?? "3000000000";

async function main(): Promise<void> {
	const auth = await initAuth();

	const authUsers = db.collection("authuser");
	const existing = await authUsers.findOne({ email: adminEmail });

	let adminId = "";

	if (existing) {
		adminId = String(existing._id);
		await authUsers.updateOne(
			{ email: adminEmail },
			{ $set: { role: "admin" } },
		);
		logger.warn(`Usuario existente promovido a rol admin: ${adminEmail}`);
	} else {
		const result = await auth.api.signUpEmail({
			body: {
				email: adminEmail,
				password: adminPassword,
				name: adminName,
			},
		});
		if (!result?.user?.id) {
			throw new Error(`No se pudo crear el usuario ${adminEmail}.`);
		}
		adminId = result.user.id;
		await authUsers.updateOne(
			{ email: adminEmail },
			{ $set: { role: "admin" } },
		);
		logger.info(`Usuario admin creado: ${adminEmail}`);
	}

	await db.collection("users").updateOne(
		{ userId: new ObjectId(adminId) },
		{
			$setOnInsert: {
				name: adminName,
				role: "admin",
				documentType: adminDocumentType,
				documentNumber: adminDocumentNumber,
				phone: adminPhone,
				status: "activo",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		},
		{ upsert: true },
	);

	logger.info(`✅ Admin semilla listo: ${adminEmail} (id ${adminId})`);
	process.exit(0);
}

main().catch((error) => {
	logger.error("❌ Error creando el admin semilla:", { error });
	process.exit(1);
});
