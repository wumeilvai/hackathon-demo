/**
 * 前置安全检测 — 在调用 Gemini 之前拦截明显的危机关键词
 * 这是双保险：Gemini prompt 里也有安全规则
 */

const CRISIS_KEYWORDS = [
  '自杀', '不想活', '去死', '结束生命', '跳楼', '割腕',
  '自残', '自伤', '伤害自己', '活不下去', '没有意义',
  '杀人', '伤害别人', '想死',
];

const SAFETY_RESPONSE = {
  safety_triggered: true,
  message: '我听到你了，你现在的感受很重要。这已经超出我能帮到你的范围了，请联系专业的心理支持——24小时心理援助热线：400-161-9995 或 北京心理危机研究与干预中心：010-82951332。你值得被好好对待 💚',
};

/**
 * 检测用户输入是否包含危机关键词
 * @param {string} question
 * @returns {{ triggered: boolean, response?: object }}
 */
export function checkSafety(question) {
  const normalized = question.toLowerCase();
  const triggered = CRISIS_KEYWORDS.some((kw) => normalized.includes(kw));

  if (triggered) {
    return { triggered: true, response: SAFETY_RESPONSE };
  }
  return { triggered: false };
}
