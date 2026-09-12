import { getEnv } from "../env";
import { AnalyzeFailure } from "../errors";

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AnalyzeFailure(
      "invalid_ai_json",
      "The model did not return JSON.",
      { retryable: true, status: 502 },
    );
  }
  return candidate.slice(start, end + 1);
}

async function completeXai(system: string, user: string) {
  const env = getEnv();
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.xaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.xaiModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AnalyzeFailure(
      "unknown",
      `xAI request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      { retryable: response.status >= 500, status: 502 },
    );
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new AnalyzeFailure("invalid_ai_json", "xAI returned an empty response.", {
      retryable: true,
      status: 502,
    });
  }
  return content;
}

async function completeGemini(system: string, user: string) {
  const env = getEnv();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.geminiApiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AnalyzeFailure(
      "unknown",
      `Gemini request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      { retryable: response.status >= 500, status: 502 },
    );
  }

  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n");
  if (!content) {
    throw new AnalyzeFailure("invalid_ai_json", "Gemini returned an empty response.", {
      retryable: true,
      status: 502,
    });
  }
  return content;
}

async function completeOpenAI(system: string, user: string) {
  const env = getEnv();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      reasoning_effort: env.openaiReasoning || "none",
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AnalyzeFailure(
      "unknown",
      `OpenAI request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      { retryable: response.status >= 500, status: 502 },
    );
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new AnalyzeFailure("invalid_ai_json", "OpenAI returned an empty response.", {
      retryable: true,
      status: 502,
    });
  }
  return content;
}

export async function generateReportJson(system: string, user: string) {
  const env = getEnv();
  try {
    const raw =
      env.aiProvider === "xai"
        ? await completeXai(system, user)
        : env.aiProvider === "openai"
          ? await completeOpenAI(system, user)
          : await completeGemini(system, user);
    return extractJson(raw);
  } catch (error) {
    if (error instanceof AnalyzeFailure) throw error;
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new AnalyzeFailure(
        "ai_timeout",
        "The model timed out. Retry, or switch providers.",
        { retryable: true, status: 504 },
      );
    }
    throw new AnalyzeFailure(
      "unknown",
      error instanceof Error ? error.message : "The model request failed.",
      { retryable: true, status: 502 },
    );
  }
}
