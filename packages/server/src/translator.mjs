// 旧模式：整技能对象翻译，依赖 ANTHROPIC_API_KEY（需密钥，按全局规则使用前需询问）。
// 推荐使用 packages/server/src/index.mjs 的 translateText（Google 免费 + md5 缓存）。
// 本模块保留以兼容 /api/translate 的 id 旧模式调用，新代码勿直接依赖。
import { ANTHROPIC_MODEL, callAnthropic } from './llm-client.mjs';

export async function translateSkill(skill, targetLang = 'zh-CN') {
  if (targetLang !== 'zh-CN' || skill.i18n?.name_zh) return skill;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[translator] ANTHROPIC_API_KEY not set, skipping translation');
    return skill;
  }

  const prompt = `Translate these skill metadata to Chinese (简体中文). Return JSON only, no markdown.

Current metadata:
- name: ${skill.name}
- description: ${skill.description || '(none)'}
- category: ${skill.category || '(none)'}

Return JSON format (translate only the values):
{
  "name_zh": "中文名称",
  "description_zh": "中文描述",
  "category_zh": "中文分类"
}

Guidelines:
- Keep technical terms like "API", "MCP", "LLM" in English when appropriate
- Use common Chinese equivalents for concepts (e.g., "skill" → "技能", "rule" → "规则")
- Keep descriptions concise (under 100 chars)
- Preserve the technical meaning
- Return valid JSON only`;

  try {
    const text = await callAnthropic(prompt, { max_tokens: 500 });
    const translated = JSON.parse(text);

    return {
      ...skill,
      i18n: {
        name_zh: translated.name_zh,
        description_zh: translated.description_zh,
        category_zh: translated.category_zh,
        translatedAt: new Date().toISOString(),
        translationModel: ANTHROPIC_MODEL,
      },
    };
  } catch (e) {
    console.error(`[translator] error: ${e.message}`);
    return skill;
  }
}
