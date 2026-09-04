import type { AxiosInstance } from "axios";
import axios from "axios";

import type { IHttpClient } from "@/shared/port/IHttpClient.port.js";

export class HttpClient implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create();
  }

  async post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async delete<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}
