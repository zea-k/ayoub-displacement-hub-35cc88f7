import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";

export const createLovableAiGatewayProvider = (lovableApiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: lovableApiKey,
    headers: {
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

