declare module "pg" {
  export class Pool {
    constructor(config?: {
      connectionString?: string;
      ssl?: { rejectUnauthorized: boolean } | undefined;
    });

    query<T = unknown>(
      text: string,
      values?: unknown[]
    ): Promise<{
      rows: T[];
    }>;
  }
}
