// forge-ignore-next-line
import "dotenv/config";

export const env = {
	port: Number(process.env.PORT ?? 3000),
	mongodbUri:
		process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tickets_buy",
};
