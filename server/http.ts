/**
 * The slice of the serverless request/response pair these two routes use.
 *
 * Declared here rather than pulled from @vercel/node so the project does not
 * take a host-specific dependency for four fields — the same handlers run
 * unchanged on anything with an Express-shaped signature.
 */

export interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
}

export interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  end: () => void
}
