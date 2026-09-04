import mongoose from "mongoose";

export async function connectDB(uri: string) {
	try {
		await mongoose.connect(uri);
		console.log("MongoDB conectado");
	} catch (error) {
		console.error("Error conectando a MongoDB:", error);
		process.exit(1);
	}
}
