import "dotenv/config";

import RaffleModel from "../features/raffle/adapters/out/persistence/schemas/Raffle.schema.js";
import { env } from "../platform/config/Env.config.js";
import { connectDB } from "../platform/database/Db.config.js";
import logger from "../platform/logger/index.js";
import { ensureUniqueSlug } from "../shared/utils/ensureUniqueSlug.js";
import { slugify } from "../shared/utils/slugify.js";

async function main(): Promise<void> {
	await connectDB(env.mongodbUri);
	await RaffleModel.syncIndexes();

	const raffles = await RaffleModel.find({
		$or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
	}).lean();

	logger.info(`Sorteos sin slug: ${raffles.length}`);

	let updated = 0;
	for (const raffle of raffles) {
		const base = slugify(raffle.title);
		const slug = await ensureUniqueSlug(base, async (candidate) => {
			const existing = await RaffleModel.findOne({ slug: candidate })
				.select("_id")
				.lean();
			return existing ? { id: String(existing._id) } : null;
		});

		await RaffleModel.updateOne({ _id: raffle._id }, { $set: { slug } });
		updated += 1;
		logger.info(`Raffle ${String(raffle._id)} -> slug ${slug}`);
	}

	logger.info(`Slugs asignados: ${updated}`);
	process.exit(0);
}

await main().catch((error) => {
	logger.error(error);
	process.exit(1);
});
