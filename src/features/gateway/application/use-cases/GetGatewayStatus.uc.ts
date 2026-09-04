import type { IWompiConfigReader } from "@/shared/contracts/IWompiConfigReader.contract.js";

export interface GatewayStatusData {
  gateway: string;
  enabled: boolean;
  configured: boolean;
  environment?: "test" | "prod";
  webhookUrl: string;
}

export class GetGatewayStatus {
  constructor(
    private readonly wompiConfigReader: IWompiConfigReader,
    private readonly serverUrl: string
  ) {}

  async execute(): Promise<GatewayStatusData[]> {
    const settings = await this.wompiConfigReader.getWompiSettings();
    return [
      {
        gateway: "wompi",
        enabled: Boolean(settings?.enabled),
        configured: Boolean(settings?.publicKey && settings?.privateKey && settings?.eventsKey),
        environment: settings?.environment ?? "test",
        webhookUrl: `${this.serverUrl}/api/webhook/wompi/events`
      }
    ];
  }
}
