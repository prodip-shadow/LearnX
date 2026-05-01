import { NextResponse } from 'next/server';

const mask = (s = '') => {
  if (!s) return '';
  if (s.length <= 8) return '****';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
};

export async function GET() {
  try {
    const env = process.env.NODE_ENV || 'development';

    const openRouterKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_ROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
      '';

    const openAiKey =
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      '';

    const rawUrl =
      process.env.OPENROUTER_URL ||
      process.env.OPEN_ROUTER_URL ||
      'https://openrouter.ai/api/v1/chat/completions';
    const normalizedUrl = rawUrl.replace(
      'https://api.openrouter.ai/v1',
      'https://openrouter.ai/api/v1',
    );

    const info = {
      environment: env,
      hasOpenRouter: Boolean(openRouterKey),
      hasOpenAI: Boolean(openAiKey),
      openRouterUrl: normalizedUrl,
      model:
        process.env.OPENROUTER_MODEL ||
        process.env.OPENAI_MODEL ||
        process.env.OPENAI_MODEL ||
        null,
      openRouterKey:
        env === 'development'
          ? mask(openRouterKey)
          : openRouterKey
            ? 'present'
            : 'absent',
      openAiKey:
        env === 'development'
          ? mask(openAiKey)
          : openAiKey
            ? 'present'
            : 'absent',
    };

    return NextResponse.json({ ok: true, info });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
