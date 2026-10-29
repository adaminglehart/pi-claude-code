export interface LiteLlmConfig {
  baseUrl: string;
  apiKey: string;
}

/** Read the explicit gateway settings without changing Claude's subscription login. */
export function litellmConfig(env: Record<string, string | undefined>): LiteLlmConfig | undefined {
  const baseUrl = env.PI_CLAUDE_CODE_LITELLM_BASE_URL;
  const apiKey = env.PI_CLAUDE_CODE_LITELLM_API_KEY;
  if (baseUrl === undefined && apiKey === undefined) return undefined;
  if (!baseUrl || !apiKey) {
    throw new Error("Set both PI_CLAUDE_CODE_LITELLM_BASE_URL and PI_CLAUDE_CODE_LITELLM_API_KEY.");
  }
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("The LiteLLM base URL is not valid.");
  }
  const loopback = ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
    url.username || url.password || url.search || url.hash || url.pathname !== "/"
  ) {
    throw new Error("Use an HTTPS LiteLLM root URL without credentials, a query, or a fragment. Loopback HTTP is permitted for local checks.");
  }
  if (!/^[A-Za-z0-9._~-]+$/u.test(apiKey)) {
    throw new Error("The LiteLLM API key contains characters that are not permitted in an authentication header.");
  }
  return { baseUrl: url.origin, apiKey };
}
