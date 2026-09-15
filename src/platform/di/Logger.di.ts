import { WinstonLogger } from "../../infra/logger/WinstonLogger.adapter.js";

import type { ILogger } from "../../shared/port/ILogger.port.js";

export const appLogger: ILogger = new WinstonLogger();
