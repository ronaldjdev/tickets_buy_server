import { WinstonLogger } from "@/infra/logger/WinstonLogger.adapter";

import type { ILogger } from "@/shared/port/ILogger.port";

export const appLogger: ILogger = new WinstonLogger();
