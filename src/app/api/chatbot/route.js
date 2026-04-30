import { NextResponse } from 'next/server';

const TEACHERS_DATA = [
  {
    name: 'Prodip Hore',
    info: 'Prodip Hore is a student of Patuakhali Science and Technology University, pursuing a BSc in Engineering in Computer Science and Engineering. He has a strong interest in mathematics, physics, and chemistry.',
  },
];

const getSystemPrompt = () => {
  const teachersInfo = TEACHERS_DATA.map((t) => `- ${t.name}: ${t.info}`).join(
    '\n',
  );
  return `You are LearnX's educational assistant.

You may answer only two kinds of questions:

1. Study questions: explain school, college, exam, and general academic topics in a helpful, concise way.
2. Teacher profile questions: answer only using this approved teacher information:
${teachersInfo}

If the user asks anything outside those two categories, reply exactly with:
"Sorry, I can only answer study-related questions and approved teacher profile questions."

Always reply in English.`;
};

const getFallbackReply = (message) => {
  const normalized = message.toLowerCase();
  const matchedTeacher = TEACHERS_DATA.find((teacher) =>
    normalized.includes(teacher.name.toLowerCase()),
  );

  if (matchedTeacher) {
    return matchedTeacher.info;
  }

  const derivativeReply = getDerivativeReply(message);
  if (derivativeReply) {
    return derivativeReply;
  }

  const arithmeticReply = getArithmeticReply(message);
  if (arithmeticReply) {
    return arithmeticReply;
  }

  const studyKeywords = [
    'study',
    'exam',
    'math',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'english',
    'science',
    'assignment',
    'homework',
    'admission',
    'lesson',
    'chapter',
    'course',
    'student',
    'teacher',
    'school',
    'college',
    'university',
  ];

  if (studyKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'I can help with study topics, exam preparation, and approved teacher details. Please ask a specific academic question, and I will answer in English.';
  }

  return 'Sorry, I can only answer study-related questions and approved teacher profile questions.';
};

const getDerivativeReply = (message) => {
  const normalized = message
    .trim()
    .replace(/\s+/g, '')
    .replace(/[=?]+$/g, '');
  const match = normalized.match(/^d\(?(.+)\)?\/d([a-z])$/i);

  if (!match) {
    return null;
  }

  const expression = match[1];
  const variable = match[2].toLowerCase();
  const derivative = differentiateExpression(expression, variable);

  return derivative ? `d(${expression})/d${variable} = ${derivative}` : null;
};

const differentiateExpression = (expression, variable) => {
  const terms = expression
    .replace(/-/g, '+-')
    .split('+')
    .map((term) => term.trim())
    .filter(Boolean);

  const derivedTerms = terms
    .map((term) => differentiateTerm(term, variable))
    .filter((term) => term !== null && term !== '0');

  if (derivedTerms.length === 0) {
    return '0';
  }

  return derivedTerms
    .map((term, index) => {
      if (index === 0) {
        return term;
      }

      return term.startsWith('-') ? `- ${term.slice(1)}` : `+ ${term}`;
    })
    .join(' ');
};

const differentiateTerm = (term, variable) => {
  if (/^[+-]?\d+(?:\.\d+)?$/.test(term)) {
    return '0';
  }

  const variablePattern = new RegExp(
    `^([+-]?\\d*(?:\\.\\d+)?)?${variable}(?:\\^([+-]?\\d+))?$`,
    'i',
  );
  const variableMatch = term.match(variablePattern);
  if (variableMatch) {
    const coefficient = parseCoefficient(variableMatch[1]);
    const power = variableMatch[2] ? Number(variableMatch[2]) : 1;

    if (!Number.isFinite(power) || power === 0) {
      return '0';
    }

    const newCoefficient = coefficient * power;
    const newPower = power - 1;

    if (newPower === 1) {
      return formatCoefficientX(newCoefficient, variable);
    }

    if (newPower === 0) {
      return String(newCoefficient);
    }

    return `${formatCoefficient(newCoefficient)}${variable}^${newPower}`;
  }

  return null;
};

const parseCoefficient = (value) => {
  if (value === undefined || value === '' || value === '+') {
    return 1;
  }

  if (value === '-') {
    return -1;
  }

  return Number(value);
};

const formatCoefficient = (value) => {
  if (value === 1) {
    return '';
  }

  if (value === -1) {
    return '-';
  }

  return String(value);
};

const formatCoefficientX = (value, variable = 'x') => {
  if (value === 1) {
    return variable;
  }

  if (value === -1) {
    return `-${variable}`;
  }

  return `${value}${variable}`;
};

const getArithmeticReply = (message) => {
  const candidate = message.replace(/[=?]/g, ' ').trim();
  const expressionMatch = candidate.match(/[0-9+\-*/().\s]+/g);

  if (!expressionMatch) {
    return null;
  }

  const expression = expressionMatch.join('').replace(/\s+/g, '');

  if (
    !expression ||
    !/[+\-*/]/.test(expression) ||
    /[^0-9+\-*/().]/.test(expression)
  ) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${expression});`)();

    if (typeof result === 'number' && Number.isFinite(result)) {
      return `${expression} = ${result}`;
    }

    return null;
  } catch {
    return null;
  }
};

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const apiKey =
      process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ message: getFallbackReply(message) });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(),
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      return NextResponse.json({ message: getFallbackReply(message) });
    }

    const data = await response.json();
    const aiMessage =
      data.choices[0]?.message?.content || getFallbackReply(message);

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return NextResponse.json({
      message:
        'Sorry, I can only answer study-related questions and approved teacher profile questions.',
    });
  }
}
