import winston from "winston";

import type { ILogger } from "@/shared/port/ILogger.port.js";

const { combine, timestamp, colorize, printf, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const emoji = level.includes("error")
    ? "❌"
    : level.includes("warn")
      ? "⚠️"
      : level.includes("info")
        ? "ℹ️"
        : level.includes("debug")
          ? "🐛"
          : level.includes("http")
            ? "🔗"
            : "📘";

  const base = `[${timestamp}] ${emoji} ${level}: ${message}`;
  return stack ? `${base}\n${stack}` : base;
});

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true })),
  defaultMeta: { service: "call-automation" },
  transports: [
    new winston.transports.Console({
      format: combine(colorize({ all: true }), consoleFormat)
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.json()
    }),
    new winston.transports.File({ filename: "logs/combined.log", format: winston.format.json() })
  ]
});

export class WinstonLogger implements ILogger {
  info(message: string, meta?: unknown): void {
    winstonLogger.info(message, meta);
  }

  warn(message: string, meta?: unknown): void {
    winstonLogger.warn(message, meta);
  }

  error(message: string, meta?: unknown): void {
    winstonLogger.error(message, meta);
  }

  debug(message: string, meta?: unknown): void {
    winstonLogger.debug(message, meta);
  }
}

export const logger: ILogger = new WinstonLogger();
