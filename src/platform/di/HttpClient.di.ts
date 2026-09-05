import { HttpClient } from "@/infra/http/HttpClient";

import type { IHttpClient } from "@/shared/port/IHttpClient.port";

export const httpClient: IHttpClient = new HttpClient();
