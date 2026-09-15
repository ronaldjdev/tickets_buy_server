import { HttpClient } from "../../infra/http/HttpClient.js";

import type { IHttpClient } from "../../shared/port/IHttpClient.port.js";

export const httpClient: IHttpClient = new HttpClient();
