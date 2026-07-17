export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

export async function callAnthropic(prompt, { max_tokens } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt must be a non-empty string');
  }
  if (!Number.isInteger(max_tokens) || max_tokens <= 0) {
    throw new Error('max_tokens must be a positive integer');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Anthropic API returned empty text');
  }
  return text;
}
