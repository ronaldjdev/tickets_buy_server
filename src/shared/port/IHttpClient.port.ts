export interface IHttpClient {
  post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T>;

  get<T>(url: string, config?: Record<string, unknown>): Promise<T>;

  delete<T>(url: string, config?: Record<string, unknown>): Promise<T>;
}
