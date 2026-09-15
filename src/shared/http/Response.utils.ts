import type { Paginate } from "../types/types.js";

type HttpLikeResponse = {
	status(code: number): { json(body: unknown): unknown };
};

type ApiResponse<T> = {
	success: boolean;
	message: string;
	total?: number;
	data?: T;
	paginate?: Paginate;
};

export default function response<T>(
	res: HttpLikeResponse,
	status: number,
	message: string,
	data?: T,
	total?: number,
	paginate?: Paginate,
) {
	const response: ApiResponse<T> = {
		success: status >= 200 && status < 300,
		message,
		...(total !== undefined ? { total } : {}),
		...(data !== undefined ? { data } : {}), // ✅ acepta [] o 0
		...(paginate !== undefined ? { paginate } : {}), // ✅ siempre que venga lo incluye
	};

	return res.status(status).json(response);
}
