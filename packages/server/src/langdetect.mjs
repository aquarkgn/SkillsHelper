// 语言判定 —— 本地零依赖，不走外网。
// 目的：在调用翻译 API 前短路掉已是中文的文本，避免无意义的外网请求。
//
// 判定规则：统计 CJK 统一表意文字（U+4E00–U+9FFF）在文本中的占比。
// 占比 >= 30% 视为中文，跳过翻译。技能描述多为英文夹中文术语
// （如"使用 MCP 协议"），纯中文描述远超 30%，纯英文描述为 0%，
// 阈值不敏感。

/**
 * 判定文本是否为中文
 * @param {string} text - 待判定文本
 * @returns {boolean} true 表示已是中文，无需翻译
 */
export function isChinese(text) {
  if (!text || !text.trim()) return true; // 空文本视为无需翻译
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  return cjk / text.length >= 0.3;
}

/**
 * 检测文本源语言代码（用于翻译缓存的 from 字段）。
 * google-translate-api-x 偶发不返回 from.language.code（部分文本 Google 无法判定源语言），
 * 用本地检测兜底，避免 from 字段落盘为 'unknown'。
 *
 * 判定逻辑与 isChinese 一致：CJK 占比 >= 30% 视为中文，否则视为英文
 * （技能描述以英文为主，其他语言罕见；中文已由 isChinese 判定）。
 *
 * @param {string} text - 待判定文本
 * @returns {'zh'|'en'|'unknown'} 语言代码
 */
export function detectLanguage(text) {
  if (!text || !text.trim()) return 'unknown';
  return isChinese(text) ? 'zh' : 'en';
}
