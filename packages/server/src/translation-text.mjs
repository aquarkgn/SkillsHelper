// 可由 HTTP 服务和桌面桥接复用的元数据翻译能力。
// 翻译只在调用方显式请求时执行；扫描阶段不会发送本地内容到翻译服务。

import { translate } from 'google-translate-api-x';
import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';
import { isChinese, detectLanguage } from './langdetect.mjs';
import { getCached, setCached } from './translate-cache.mjs';

// 尊重 HTTP_PROXY / HTTPS_PROXY / NO_PROXY，保持旧服务的网络行为。
setGlobalDispatcher(new EnvHttpProxyAgent());

function translationProvider() {
  return process.env.SKILLHELPER_TRANSLATION_PROVIDER || 'google';
}

/**
 * 翻译单段文本：中文短路、MD5 缓存、8 秒超时，失败时回退原文。
 *
 * @returns {Promise<{result:string,status:'source'|'cached'|'translated'|'unchanged'|'failed'|'timeout',provider:string,error?:string}>}
 */
export async function translateText(text, targetLang = 'zh-CN') {
  const provider = translationProvider();
  if (!text || !text.trim()) return { result: '', status: 'source', provider };
  if (isChinese(text)) return { result: text, status: 'source', provider };

  const cached = getCached(text, { to: targetLang, provider });
  if (cached) return { result: cached.result, status: 'cached', provider };

  if (provider !== 'google') {
    return {
      result: text,
      status: 'failed',
      provider,
      error: `翻译供应商 ${provider} 尚未配置`,
    };
  }

  try {
    const result = await Promise.race([
      translate(text, { to: targetLang }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('translate timeout')), 8000)),
    ]);
    const translated = result.text || text;
    const from = result.from?.language?.code || detectLanguage(text);
    if (translated === text) return { result: text, status: 'unchanged', provider };

    setCached(text, translated, from, { to: targetLang, provider });
    return { result: translated, status: 'translated', provider };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[translate] error: ${message}`);
    return {
      result: text,
      status: message === 'translate timeout' ? 'timeout' : 'failed',
      provider,
      error: message,
    };
  }
}
