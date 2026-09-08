import { type Db, MongoClient } from "mongodb";
import mongoose from "mongoose";

import logger from "@/platform/logger/index.js";

let mongoClient: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectDB(uri: string) {
	try {
		// Opciones recomendadas para replica set
		await mongoose.connect(uri, {
			// Estas opciones ayudan con la conexión a replica sets
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		logger.info("✅ Conectado a MongoDB (Replica Set)");

		// Verificar el estado del replica set
		if (!mongoose.connection.db) {
			throw new Error(
				"La conexión a la base de datos no está establecida completamente.",
			);
		}
		const admin = mongoose.connection.db.admin();
		const status = await admin.command({ replSetGetStatus: 1 });
		logger.info(
			`📊 Replica Set: ${status.set}, Estado: ${status.myState === 1 ? "PRIMARY" : "SECONDARY"}`,
		);

		// Conectar el cliente de MongoDB nativo
		if (!mongoClient) {
			logger.info("🔌 Conectando MongoClient nativo...");
			mongoClient = new MongoClient(uri, {
				replicaSet: "rs0",
				serverSelectionTimeoutMS: 5000,
			});
			await mongoClient.connect();
			dbInstance = mongoClient.db();
			logger.info("✅ MongoClient nativo conectado");
		}
	} catch (error) {
		logger.error("❌ Error conectando a MongoDB:", {
			operation: "connectDB",
			error,
		});
		throw error;
	}
}

function getDbInstance(): Db {
	if (!dbInstance) {
		const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
		if (!uri) {
			throw new Error(
				"Las variables de entorno MONGO_URI o MONGODB_URI no están definidas al intentar conectar el cliente de MongoDB.",
			);
		}
		logger.info("Initializing lazy MongoClient...");
		mongoClient = new MongoClient(uri, {
			replicaSet: "rs0",
			serverSelectionTimeoutMS: 5000,
		});
		dbInstance = mongoClient.db();
	}
	return dbInstance;
}

export const db = new Proxy({} as Db, {
	get(_target, prop, receiver) {
		const instance = getDbInstance();
		const value = Reflect.get(instance, prop, receiver);
		if (typeof value === "function") {
			return value.bind(instance);
		}
		return value;
	},
});

// Manejar el cierre graceful
process.on("SIGINT", async () => {
	try {
		await mongoose.connection.close();
		if (mongoClient) {
			await mongoClient.close();
		}
		logger.info("📴 Conexiones a MongoDB cerradas");
		process.exit(0);
	} catch (err) {
		logger.error("Error cerrando conexiones:", {
			operation: "connectDB",
			error: err,
		});
		process.exit(1);
	}
});

export default db;
