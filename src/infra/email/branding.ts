import { configRepo } from "../../features/config/di.js";

export interface SiteBranding {
	logoUrl?: string;
	brandName: string;
	siteUrl: string;
}

const DEFAULT_SITE_URL = "https://www.cheveremax.com";

const FALLBACK: SiteBranding = {
	brandName: "Chevere Max",
	siteUrl: DEFAULT_SITE_URL,
};

/** Resuelve el branding del sitio (logo o nombre de marca) desde la config general. */
export async function getSiteBranding(): Promise<SiteBranding> {
	try {
		const config = await configRepo.findSingleton();
		const general = config?.general;
		const siteUrl =
			process.env.FRONTEND_URL?.trim() ||
			process.env.SERVER_URL?.trim() ||
			DEFAULT_SITE_URL;
		return {
			logoUrl: general?.logoUrl?.trim() || undefined,
			brandName: general?.nameBusiness?.trim() || FALLBACK.brandName,
			siteUrl,
		};
	} catch (error) {
		console.warn(
			"No se pudo leer el branding de la configuración, usando valores por defecto:",
			error,
		);
		return FALLBACK;
	}
}
