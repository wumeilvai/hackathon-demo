import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, GENERATION_CONFIG } from './prompt.js';
import { checkSafety } from './safety.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-flash-latest',
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: GENERATION_CONFIG,
});

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 核心：探索之书
app.post('/api/explore', async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: '请告诉我你遇到了什么' });
  }

  if (question.trim().length > 500) {
    return res.status(400).json({ error: '说得简洁一点，我更容易帮到你' });
  }

  // 前置安全检测
  const safetyCheck = checkSafety(question);
  if (safetyCheck.triggered) {
    return res.json(safetyCheck.response);
  }

  try {
    const result = await model.generateContent(question.trim());
    const text = result.response.text();

    // 尝试解析 JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('Gemini 返回了非 JSON 内容:', text);
      return res.status(500).json({ error: '探索之书翻到了一页空白，再试一次？' });
    }

    // 如果 Gemini 触发了安全回复
    if (parsed.safety_triggered) {
      return res.json(parsed);
    }

    // 验证结构
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions) || parsed.suggestions.length < 3) {
      console.error('Gemini 返回格式不符:', parsed);
      return res.status(500).json({ error: '探索之书翻到了一页空白，再试一次？' });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Gemini API 调用失败:', err.message);
    return res.status(500).json({ error: '探索之书暂时合上了，稍后再试' });
  }
});

app.listen(PORT, () => {
  console.log(`🔮 探索之书后端已启动: http://localhost:${PORT}`);
});

export default app;
