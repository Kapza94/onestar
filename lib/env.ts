export type AiProviderName = "xai" | "gemini" | "openai";

function read(name: string) {
  return process.env[name]?.trim() || "";
}

function flag(name: string) {
  return ["1", "true", "yes", "on"].includes(read(name).toLowerCase());
}

export function getEnv() {
  const providerRaw = read("AI_PROVIDER").toLowerCase();
  const aiProvider: AiProviderName =
    providerRaw === "xai" ? "xai" : providerRaw === "openai" ? "openai" : "gemini";

  return {
    demoMode: flag("DEMO_MODE"),
    aiProvider,
    xaiApiKey: read("XAI_API_KEY"),
    xaiModel: read("XAI_MODEL") || "grok-3-mini",
    geminiApiKey: read("GEMINI_API_KEY"),
    geminiModel: read("GEMINI_MODEL") || "gemini-2.5-flash",
    openaiApiKey: read("OPENAI_API_KEY"),
    openaiModel: read("OPENAI_MODEL") || "gpt-5.6-luna",
    openaiReasoning: read("OPENAI_REASONING") || "none",
    exaApiKey: read("EXA_API_KEY"),
    firecrawlApiKey: read("FIRECRAWL_API_KEY"),
  };
}

export function activeModel() {
  const env = getEnv();
  if (env.aiProvider === "xai") return env.xaiModel;
  if (env.aiProvider === "openai") return env.openaiModel;
  return env.geminiModel;
}

export function isAiConfigured() {
  const env = getEnv();
  if (env.aiProvider === "xai") return Boolean(env.xaiApiKey);
  if (env.aiProvider === "openai") return Boolean(env.openaiApiKey);
  return Boolean(env.geminiApiKey);
}

export function isResearchConfigured() {
  return Boolean(getEnv().exaApiKey);
}
