import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { PDFParse } from 'pdf-parse';

const getSystemPrompt = (languageInstruction, resourcesContext = '') => {
  const hasResources = Boolean(resourcesContext && resourcesContext.trim());

  return `You are LearnX AI assistant. Behave like a helpful ChatGPT-style assistant.

Core behavior:
1. Answer any general question clearly and naturally.
2. Give direct answers first, then brief explanation.
3. If user asks for coding, provide practical examples.
4. If uncertain, say what is uncertain instead of guessing.
5. ${languageInstruction}
6. Use textbook-style formatting for study answers:
  - Keep steps clean and short.
  - Use markdown bullets or numbered steps where useful.
  - Write math in LaTeX delimiters: inline as $...$, block as $$...$$.
  - Avoid writing raw escaped LaTeX like \\( ... \\) unless needed.

${
  hasResources
    ? `Use the following LearnX resources when relevant. If you use them, mention the source title.

AVAILABLE RESOURCES:
${resourcesContext}`
    : 'No resource context is required for this query.'
}
`;
};

const detectLanguageStyle = (text = '') => {
  if (/[\u0980-\u09FF]/.test(text)) {
    return 'bangla';
  }

  const normalized = text.toLowerCase();
  const banglishHints = [
    'ami',
    'tumi',
    'apni',
    'kivabe',
    'kibhabe',
    'ki',
    'kano',
    'keno',
    'eta',
    'ekhon',
    'hobe',
    'ace',
    'ase',
    'korbo',
    'koro',
    'bolo',
    'lagbe',
  ];

  const hitCount = banglishHints.reduce(
    (count, word) =>
      count + (new RegExp(`\\b${word}\\b`).test(normalized) ? 1 : 0),
    0,
  );

  if (hitCount >= 2) {
    return 'banglish';
  }

  return 'auto';
};

const getLanguageInstruction = (languageStyle) => {
  if (languageStyle === 'bangla') {
    return 'Reply in Bangla (Bengali script).';
  }

  if (languageStyle === 'banglish') {
    return 'Reply in natural Banglish (Romanized Bengali), unless user asks for another language.';
  }

  return 'Reply in the same language as the user input.';
};

const shouldAttachResources = (message = '') => {
  const normalized = message.toLowerCase();

  return [
    'resource',
    'resources',
    'resume',
    'cv',
    'document',
    'pdf',
    'youtube',
    'drive',
    'image',
    'prodip',
    'tabnvir',
    'ishrak',
  ].some((term) => normalized.includes(term));
};

// Helper: Decode base64 to string
const decodeBase64 = (base64String) => {
  try {
    return Buffer.from(base64String, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '[Unable to decode document]';
  }
};

const getBase64Payload = (rawBase64 = '') => {
  if (!rawBase64) {
    return '';
  }

  if (rawBase64.startsWith('data:')) {
    const parts = rawBase64.split(',');
    return parts[1] || '';
  }

  return rawBase64;
};

const extractPdfText = async (rawBase64) => {
  try {
    const payload = getBase64Payload(rawBase64);
    if (!payload) {
      return '[Empty document]';
    }

    const pdfBuffer = Buffer.from(payload, 'base64');
    const parser = new PDFParse({ data: pdfBuffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return (parsed.text || '').trim() || '[No readable text found in PDF]';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '[Unable to extract PDF text]';
  }
};

const extractDocumentText = async (resource) => {
  if (!resource.fileBase64) {
    return '[No document content available]';
  }

  const fileName = (resource.fileName || '').toLowerCase();
  const maybePdf =
    fileName.endsWith('.pdf') ||
    resource.fileBase64.includes('application/pdf');

  if (maybePdf) {
    return extractPdfText(resource.fileBase64);
  }

  const payload = getBase64Payload(resource.fileBase64);
  const decoded = decodeBase64(payload);
  return decoded.length > 20000 ? decoded.slice(0, 20000) : decoded;
};

// Helper: Extract searchable text from resources
const extractResourceContext = async (resources) => {
  if (!resources || resources.length === 0) {
    return 'No resources available.';
  }

  const resourceTexts = await Promise.all(
    resources.map(async (resource, index) => {
      let content = `\n[Resource ${index + 1}] ${resource.title} (Type: ${resource.type})`;

      if (resource.description) {
        content += `\nDescription: ${resource.description}`;
      }

      if (resource.type === 'youtube' && resource.url) {
        content += `\nYouTube Link: ${resource.url}`;
      }

      if (resource.type === 'document') {
        const documentText = await extractDocumentText(resource);
        content += `\nDocument Content:\n${documentText}`;
        if (resource.fileName) {
          content += `\n(File: ${resource.fileName})`;
        }
      }

      if (resource.type === 'drive' && resource.url) {
        content += `\nDrive Link: ${resource.url}`;
      }

      if (resource.type === 'image' && resource.url) {
        content += `\nImage URL: ${resource.url}`;
        if (resource.description) {
          content += `\nImage Description: ${resource.description}`;
        }
      }

      if (resource.url && resource.type !== 'document') {
        content += `\nURL: ${resource.url}`;
      }

      if (resource.teacherName) {
        content += `\nBy: ${resource.teacherName}`;
      }

      return content;
    }),
  );

  const merged = resourceTexts.join('\n---');
  return merged.length > 120000 ? merged.slice(0, 120000) : merged;
};

const buildLocalResourceReply = (message, resourcesContext, resources = []) => {
  const languageStyle = detectLanguageStyle(message);
  const normalizedMessage = message.toLowerCase();
  const chunks = resourcesContext
    .split('\n---')
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'this',
    'that',
    'from',
    'about',
    'tell',
    'what',
    'who',
    'where',
    'when',
    'how',
    'resource',
    'resources',
    'of',
    'to',
    'is',
    'are',
    'ami',
    'tumi',
    'eta',
    'eita',
    'niye',
    'bolo',
    'amar',
    'tomar',
  ]);

  const keywords = normalizedMessage
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const isPersonResourceQuery =
    /resource\s+of\s+/i.test(message) ||
    /about\s+[a-z]/i.test(message) ||
    /resume\s+of\s+/i.test(message);

  let bestChunk = '';
  let bestScore = 0;

  for (const chunk of chunks) {
    const normalizedChunk = chunk.toLowerCase();
    const score = keywords.reduce(
      (total, keyword) => total + (normalizedChunk.includes(keyword) ? 1 : 0),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestChunk = chunk;
    }
  }

  const minScore = keywords.length >= 3 ? 2 : 1;

  if (bestChunk && bestScore >= minScore) {
    const snippet = bestChunk
      .split('\n')
      .filter((line) => {
        const lc = line.toLowerCase();
        return (
          !lc.startsWith('document content:') &&
          !lc.startsWith('url:') &&
          !lc.startsWith('image url:')
        );
      })
      .slice(0, 6)
      .join('\n')
      .slice(0, 900);

    if (languageStyle === 'bangla') {
      return {
        found: true,
        message: `তোমার প্রশ্নের সাথে মিল আছে এমন resource পেয়েছি:\n\n${snippet}`,
      };
    }

    if (languageStyle === 'banglish') {
      return {
        found: true,
        message: `Tomar prosner sathe match kora resource paoa geche:\n\n${snippet}`,
      };
    }

    return {
      found: true,
      message: `I found a matching resource:\n\n${snippet}`,
    };
  }

  if (isPersonResourceQuery) {
    const availableNames = [
      ...new Set(
        resources
          .map((r) => (r.teacherName || '').trim())
          .filter((name) => name.length > 0),
      ),
    ];

    if (languageStyle === 'bangla') {
      return {
        found: false,
        message: availableNames.length
          ? `এই নামে কোনো resource পাইনি। বর্তমানে resource আছে: ${availableNames.join(', ')}.`
          : 'এই নামে কোনো resource পাইনি।',
      };
    }

    if (languageStyle === 'banglish') {
      return {
        found: false,
        message: availableNames.length
          ? `Ei name kono resource pawa jayni. Ekhon resource ache: ${availableNames.join(', ')}.`
          : 'Ei name kono resource pawa jayni.',
      };
    }

    return {
      found: false,
      message: availableNames.length
        ? `I could not find resources for that person. Currently available resource owners: ${availableNames.join(', ')}.`
        : 'I could not find resources for that person.',
    };
  }

  if (languageStyle === 'bangla') {
    return {
      found: false,
      message:
        'অবশ্যই সাহায্য করতে পারি। তুমি চাইলে আমি বিষয়টা ধাপে ধাপে সহজভাবে বুঝিয়ে দিচ্ছি। কোন দিকটা আগে জানতে চাও?',
    };
  }

  if (languageStyle === 'banglish') {
    return {
      found: false,
      message:
        'Resource e direct info paini, but ami topic ta simple vabe explain korte parbo. Tumi kon part ta jante chao?',
    };
  }

  return {
    found: false,
    message:
      'I could not find a direct match in resources, but I can still explain the topic clearly. Tell me what part you want to know first.',
  };
};

// Helper: Get all resources from MongoDB
const getAllResources = async () => {
  try {
    const resourcesCollection = await getCollection('resources');
    const resources = await resourcesCollection.find({}).toArray();
    return resources || [];
  } catch (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
};

// Sends request to configured AI provider. Prefers OpenRouter if its key is present,
// otherwise falls back to OpenAI. The endpoint and model can be controlled via env vars.
const requestAI = async ({ model, messages }) => {
  const openRouterKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.OPEN_ROUTER_API_KEY ||
    process.env.NEXT_PUBLIC_OPEN_ROUTER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const rawOpenRouterUrl =
    process.env.OPENROUTER_URL ||
    process.env.OPEN_ROUTER_URL ||
    'https://openrouter.ai/api/v1/chat/completions';
  // Normalize older/wrong hostname if provided by env.
  const openRouterUrl = rawOpenRouterUrl.replace(
    'https://api.openrouter.ai/v1',
    'https://openrouter.ai/api/v1',
  );
  const openAiKey =
    process.env.OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPEN_AI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (openRouterKey) {
    return fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || model,
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
  }

  if (openAiKey) {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || model,
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
  }

  throw new Error(
    'No AI provider configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.',
  );
};

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const languageStyle = detectLanguageStyle(message);
    const languageInstruction = getLanguageInstruction(languageStyle);
    const includeResources = shouldAttachResources(message);

    let resources = [];
    let resourceContext = '';

    if (includeResources) {
      resources = await getAllResources();
      resourceContext = await extractResourceContext(resources);
    }

    // If user asked to use resources, perform a local-match check first.
    if (includeResources) {
      try {
        const localReply = buildLocalResourceReply(
          message,
          resourceContext,
          resources,
        );

        if (localReply && localReply.found) {
          return NextResponse.json({ message: localReply.message });
        }

        // If not found in resources, reply clearly that it's not available.
        const notFoundMsg =
          languageStyle === 'bangla'
            ? 'দুঃখিত, আপনার প্রশ্নের উত্তর আমাদের resources-এ নেই।'
            : languageStyle === 'banglish'
              ? 'Sorry, ei prosner uttor amar resource-e nei.'
              : 'Sorry, this is not in our resources.';

        return NextResponse.json({ message: notFoundMsg });
      } catch (err) {
        console.error('Local resource matching error:', err);
      }
    }

    // Determine available provider keys (OpenRouter preferred)
    const hasOpenRouter = Boolean(
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_ROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    );
    const hasOpenAI = Boolean(
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    );

    if (!hasOpenRouter && !hasOpenAI) {
      return NextResponse.json({
        message:
          languageStyle === 'bangla'
            ? 'AI service configure করা নেই। OPENROUTER_API_KEY অথবা OPENAI_API_KEY সেট করে সার্ভার রিস্টার্ট দাও।'
            : languageStyle === 'banglish'
              ? 'AI service configure kora nei. Set OPENROUTER_API_KEY or OPENAI_API_KEY and restart the server.'
              : 'AI service is not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY and restart the server.',
      });
    }

    const model =
      process.env.OPENAI_MODEL || process.env.OPENROUTER_MODEL || 'gpt-4o-mini';
    const baseMessages = [
      {
        role: 'system',
        content: getSystemPrompt(languageInstruction, resourceContext),
      },
      {
        role: 'user',
        content: message,
      },
    ];

    let response = await requestAI({ model, messages: baseMessages });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);

      // Retry once without resource context to avoid prompt-size/context issues.
      if (includeResources) {
        response = await requestAI({
          model,
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(languageInstruction),
            },
            {
              role: 'user',
              content: message,
            },
          ],
        });
      }

      if (!response.ok) {
        return NextResponse.json({
          message:
            languageStyle === 'bangla'
              ? 'এই মুহূর্তে AI service থেকে উত্তর আনা যাচ্ছে না। একটু পরে আবার চেষ্টা করো।'
              : languageStyle === 'banglish'
                ? 'Ekhon AI service theke response pawa jacche na. Ektu pore abar try koro.'
                : 'The AI service is temporarily unavailable. Please try again shortly.',
        });
      }
    }

    const data = await response.json();
    const aiMessage =
      data.choices[0]?.message?.content ||
      (languageStyle === 'bangla'
        ? 'উত্তর তৈরি করা যাচ্ছে না। অন্যভাবে প্রশ্নটা করে দেখো।'
        : languageStyle === 'banglish'
          ? 'Answer generate hocche na. Prosnota arekbar onno vabe koro.'
          : 'I could not generate a response. Please rephrase and try again.');

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Chatbot API Error:', error);
    const fallbackMessage =
      'I am having a temporary issue, but I can still help. Please try your question once more in a short form.';
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    const debug = isDev
      ? error && error.message
        ? error.message
        : String(error)
      : undefined;
    const payload = { message: fallbackMessage };
    if (debug) payload.debug = debug;
    return NextResponse.json(payload);
  }
}
