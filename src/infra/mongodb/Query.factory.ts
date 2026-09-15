import type { OptionsPag } from "../../shared/types/types.js";

export const QueryFactory = {
	createStatusQuery(status?: string | string[]): any {
		if (!status) return {};
		if (status === "all") return {};

		let statuses: string[];
		if (Array.isArray(status)) {
			statuses = status;
		} else if (typeof status === "string" && status.includes(",")) {
			statuses = status.split(",").map((s) => s.trim());
		} else {
			statuses = [status];
		}

		return { status: { $in: statuses } };
	},

	createDateQuery(date?: string): any {
		if (!date) return {};

		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);

		return { createdAt: { $gte: start, $lte: end } };
	},

	createAccountStatusQuery(accountStatus?: string | string[]): any {
		if (!accountStatus) return {};
		if (accountStatus === "all") return {};

		let statuses: string[];
		if (Array.isArray(accountStatus)) {
			statuses = accountStatus;
		} else if (accountStatus.includes(",")) {
			statuses = accountStatus.split(",").map((s) => s.trim());
		} else {
			statuses = [accountStatus];
		}

		return { accountStatus: { $in: statuses } };
	},

	createFilterQuery(filter: any): any {
		if (!filter || typeof filter !== "object") return {};
		return filter;
	},

	createRoleQuery(role?: string): any {
		if (!role || role === "all") return {};
		return { role };
	},

	createSearchQuery(fields: string[], q?: string): any {
		const value = (q ?? "").trim();
		if (!value) return {};
		const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const name = { $regex: new RegExp(escaped, "i") };
		return { $or: fields.map((field) => ({ [field]: name })) };
	},

	assembleQueryOptions(options: OptionsPag): any {
		const query: any = {};

		Object.assign(
			query,
			QueryFactory.createStatusQuery(options.status),
			QueryFactory.createAccountStatusQuery(options.accountStatus),
			QueryFactory.createDateQuery(options.date),
			QueryFactory.createRoleQuery(options.role),
			QueryFactory.createFilterQuery(options.filter),
		);

		return query;
	},

	createSortOptions(): any {
		return { createdAt: -1 };
	},
};
