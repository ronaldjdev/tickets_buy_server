import type { NextFunction, Request, Response } from "express";
import type { IMachineSettings } from "../../../../../../shared/contracts/IMachineSettings.contract.js";
import response from "../../../../../../shared/http/Response.utils.js";
import type { GetDocumentMachineOverview } from "../../../../application/use-cases/GetDocumentMachineOverview.uc.js";
import type { GetDocumentMachineSession } from "../../../../application/use-cases/GetDocumentMachineSession.uc.js";
import type { GetMachineSession } from "../../../../application/use-cases/GetMachineSession.uc.js";
import type { GrantMachinePlays } from "../../../../application/use-cases/GrantMachinePlays.uc.js";
import type { ListMachineGrants } from "../../../../application/use-cases/ListMachineGrants.uc.js";
import type { ListMachinePlays } from "../../../../application/use-cases/ListMachinePlays.uc.js";
import type { MarkMachinePrizeDelivered } from "../../../../application/use-cases/MarkMachinePrizeDelivered.uc.js";
import type { PlayMachine } from "../../../../application/use-cases/PlayMachine.uc.js";
import type { PlayMachineByDocument } from "../../../../application/use-cases/PlayMachineByDocument.uc.js";
import type { ReleaseMachineSecoPrize } from "../../../../application/use-cases/ReleaseMachineSecoPrize.uc.js";
import type { RestockMachineInstantPrize } from "../../../../application/use-cases/RestockMachineInstantPrize.uc.js";

function bool(value: unknown): boolean | undefined {
	if (value === "true" || value === true) return true;
	if (value === "false" || value === false) return false;
	return undefined;
}

export class MachineController {
	constructor(
		private readonly playMachine: PlayMachine,
		private readonly getMachineSession: GetMachineSession,
		private readonly getDocumentMachineOverview: GetDocumentMachineOverview,
		private readonly getDocumentMachineSession: GetDocumentMachineSession,
		private readonly playMachineByDocument: PlayMachineByDocument,
		private readonly listMachinePlays: ListMachinePlays,
		private readonly markMachinePrizeDelivered: MarkMachinePrizeDelivered,
		private readonly releaseMachineSecoPrize: ReleaseMachineSecoPrize,
		private readonly restockMachineInstantPrize: RestockMachineInstantPrize,
		private readonly listMachineGrants: ListMachineGrants,
		private readonly grantMachinePlays: GrantMachinePlays,
		private readonly settings: IMachineSettings,
	) {}

	session = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const session = await this.getMachineSession.execute(
				String(req.params.reference),
			);
			response(res, 200, "Sesión de la máquina", session);
		} catch (error) {
			next(error);
		}
	};

	play = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.playMachine.execute(
				String(req.params.reference),
			);
			response(res, 200, "Tiro jugado", result);
		} catch (error) {
			next(error);
		}
	};

	lookup = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const overview = await this.getDocumentMachineOverview.execute(
				String(req.query.documentNumber ?? ""),
			);
			response(res, 200, "Tiros del documento", overview);
		} catch (error) {
			next(error);
		}
	};

	documentSession = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const session = await this.getDocumentMachineSession.execute(
				String(req.params.documentNumber),
				String(req.query.raffleId ?? ""),
			);
			response(res, 200, "Sesión de la máquina", session);
		} catch (error) {
			next(error);
		}
	};

	documentPlay = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.playMachineByDocument.execute(
				String(req.body?.documentNumber ?? ""),
				String(req.body?.raffleId ?? ""),
			);
			response(res, 200, "Tiro jugado", result);
		} catch (error) {
			next(error);
		}
	};

	listPlays = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.listMachinePlays.execute({
				raffleId: req.query.raffleId ? String(req.query.raffleId) : undefined,
				documentNumber: req.query.documentNumber
					? String(req.query.documentNumber)
					: undefined,
				won: bool(req.query.won),
				delivered: bool(req.query.delivered),
				page: req.query.page ? Number(req.query.page) : undefined,
				limit: req.query.limit ? Number(req.query.limit) : undefined,
			});
			response(res, 200, "Tiros de la máquina", result);
		} catch (error) {
			next(error);
		}
	};

	markDelivered = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const play = await this.markMachinePrizeDelivered.execute(
				String(req.params.id),
				Boolean(req.body?.delivered),
			);
			response(res, 200, "Premio actualizado", play);
		} catch (error) {
			next(error);
		}
	};

	releaseSeco = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await this.releaseMachineSecoPrize.execute(
				String(req.body?.raffleId ?? ""),
				String(req.body?.prizeType ?? ""),
			);
			response(res, 200, "Premio liberado", null);
		} catch (error) {
			next(error);
		}
	};

	restock = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await this.restockMachineInstantPrize.execute(
				String(req.body?.raffleId ?? ""),
				String(req.body?.prizeId ?? ""),
				Number(req.body?.amount),
			);
			response(res, 200, "Premio repuesto", null);
		} catch (error) {
			next(error);
		}
	};

	listGrants = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const grants = await this.listMachineGrants.execute({
				documentNumber: req.query.documentNumber
					? String(req.query.documentNumber)
					: undefined,
				raffleId: req.query.raffleId ? String(req.query.raffleId) : undefined,
				limit: req.query.limit ? Number(req.query.limit) : undefined,
			});
			response(res, 200, "Créditos de tiros", grants);
		} catch (error) {
			next(error);
		}
	};

	createGrant = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const grant = await this.grantMachinePlays.execute({
				documentNumber: String(req.body?.documentNumber ?? ""),
				raffleId: String(req.body?.raffleId ?? ""),
				delta: Number(req.body?.delta),
				note: req.body?.note ? String(req.body.note) : undefined,
				createdBy: req.user?.email ?? req.user?.id,
			});
			response(res, 201, "Crédito registrado", grant);
		} catch (error) {
			next(error);
		}
	};

	getSettings = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			response(res, 200, "Configuración de la máquina", {
				enabled: await this.settings.isEnabled(),
				playsRule: await this.settings.getPlaysRule(),
			});
		} catch (error) {
			next(error);
		}
	};

	updateSettings = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const enabled = bool(req.body?.enabled);
			const playsRuleRaw = req.body?.playsRule as
				| { every?: unknown; plays?: unknown }
				| null
				| undefined;
			const hasPlaysRule = playsRuleRaw !== undefined;

			if (enabled === undefined && !hasPlaysRule) {
				throw new Error(
					"Debes indicar enabled o playsRule para actualizar la configuración.",
				);
			}

			let playsRule: { every: number; plays: number } | null | undefined;
			if (hasPlaysRule) {
				if (playsRuleRaw === null) {
					playsRule = null;
				} else {
					const every = Number(playsRuleRaw?.every);
					const plays = Number(playsRuleRaw?.plays);
					if (!Number.isInteger(every) || every < 1) {
						throw new Error(
							"La regla de tiros requiere una cantidad de boletos entera mayor a 0.",
						);
					}
					if (!Number.isInteger(plays) || plays < 0) {
						throw new Error(
							"Los tiros de la regla deben ser un entero mayor o igual a 0.",
						);
					}
					playsRule = { every, plays };
				}
			}

			if (enabled !== undefined) await this.settings.setEnabled(enabled);
			if (hasPlaysRule) await this.settings.setPlaysRule(playsRule ?? null);

			response(res, 200, "Configuración actualizada", {
				enabled: enabled ?? (await this.settings.isEnabled()),
				playsRule:
					playsRule === undefined
						? await this.settings.getPlaysRule()
						: playsRule,
			});
		} catch (error) {
			next(error);
		}
	};
}
