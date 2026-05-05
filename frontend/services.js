/**
 * 探索之书 — API 调用封装
 */

const API_BASE = '/api';

/**
 * 向探索之书提问
 * @param {string} question
 * @returns {Promise<object>}
 */
export async function askBook(question) {
  const res = await fetch(`${API_BASE}/explore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '网络开小差了' }));
    throw new Error(err.error || '未知错误');
  }

  return res.json();
}
