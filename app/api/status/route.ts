import { activeModel, getEnv, isAiConfigured, isResearchConfigured } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  return Response.json({
    demoMode: env.demoMode,
    aiProvider: env.aiProvider,
    aiModel: activeModel(),
    exaConfigured: isResearchConfigured(),
    firecrawlConfigured: Boolean(env.firecrawlApiKey),
    aiConfigured: isAiConfigured(),
  });
}
