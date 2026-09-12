export type AiProviderName = "xai" | "gemini";

function read(name: string) {
  return process.env[name]?.trim() || "";
}

function flag(name: string) {
  return ["1", "true", "yes", "on"].includes(read(name).toLowerCase());
}

export function getEnv() {
  const providerRaw = read("AI_PROVIDER").toLowerCase();
  const aiProvider: AiProviderName =
    providerRaw === "xai" ? "xai" : "gemini";

  return {
    demoMode: flag("DEMO_MODE"),
    aiProvider,
    xaiApiKey: read("XAI_API_KEY"),
    xaiModel: read("XAI_MODEL") || "grok-3-mini",
    geminiApiKey: read("GEMINI_API_KEY"),
    geminiModel: read("GEMINI_MODEL") || "gemini-2.5-flash",
    exaApiKey: read("EXA_API_KEY"),
    firecrawlApiKey: read("FIRECRAWL_API_KEY"),
  };
}

export function isAiConfigured() {
  const env = getEnv();
  return env.aiProvider === "xai" ? Boolean(env.xaiApiKey) : Boolean(env.geminiApiKey);
}

export function isResearchConfigured() {
  return Boolean(getEnv().exaApiKey);
}
