import { askBook } from './services.js';

// ---- 状态 ----
let currentView = 'welcome';
let suggestions = [];
let selectedSuggestion = null;

// ---- DOM ----
const views = {
  welcome: document.getElementById('view-welcome'),
  asking: document.getElementById('view-asking'),
  loading: document.getElementById('view-loading'),
  suggestions: document.getElementById('view-suggestions'),
  reveal: document.getElementById('view-reveal'),
  safety: document.getElementById('view-safety'),
  error: document.getElementById('view-error'),
};

const els = {
  btnOpen: document.getElementById('btn-open'),
  inputQ: document.getElementById('input-question'),
  charCount: document.getElementById('char-count'),
  btnAsk: document.getElementById('btn-ask'),
  cards: document.getElementById('cards'),
  btnBackAsk: document.getElementById('btn-back-ask'),
  revealCard: document.getElementById('reveal-card'),
  btnScience: document.getElementById('btn-science'),
  sciencePanel: document.getElementById('science-panel'),
  scienceContent: document.getElementById('science-content'),
  btnAgain: document.getElementById('btn-again'),
  safetyMsg: document.getElementById('safety-message'),
  btnSafetyBack: document.getElementById('btn-safety-back'),
  errorMsg: document.getElementById('error-message'),
  btnErrorRetry: document.getElementById('btn-error-retry'),
};

// ---- 视图切换 ----
function showView(name) {
  views[currentView]?.classList.remove('active');
  currentView = name;
  const target = views[name];
  target.classList.remove('active');
  // 强制重排以重新触发动画
  void target.offsetWidth;
  target.classList.add('active');
}

// ---- 粒子背景 ----
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 40;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196,149,106,${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ---- 事件绑定 ----

// 翻开书
els.btnOpen.addEventListener('click', () => showView('asking'));

// 输入监听
els.inputQ.addEventListener('input', () => {
  const len = els.inputQ.value.trim().length;
  els.charCount.textContent = `${els.inputQ.value.length}/500`;
  els.btnAsk.disabled = len === 0;
});

// 示例 chip 点击
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    els.inputQ.value = chip.dataset.q;
    els.inputQ.dispatchEvent(new Event('input'));
    els.inputQ.focus();
  });
});

// 提问
els.btnAsk.addEventListener('click', handleAsk);
els.inputQ.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !els.btnAsk.disabled) {
    e.preventDefault();
    handleAsk();
  }
});

async function handleAsk() {
  const q = els.inputQ.value.trim();
  if (!q) return;

  showView('loading');

  try {
    const data = await askBook(q);

    if (data.safety_triggered) {
      els.safetyMsg.textContent = data.message;
      showView('safety');
      return;
    }

    if (!data.suggestions || data.suggestions.length < 3) {
      throw new Error('返回数据格式不对');
    }

    suggestions = data.suggestions;
    renderCards();
    showView('suggestions');
  } catch (err) {
    els.errorMsg.textContent = err.message || '探索之书暂时合上了，稍后再试';
    showView('error');
  }
}

// 渲染三张卡片
function renderCards() {
  els.cards.innerHTML = suggestions
    .map(
      (s, i) => `
    <div class="card" data-idx="${i}">
      <div class="card-emoji">${s.emoji}</div>
      <div class="card-body">
        <div class="card-title">${s.title}</div>
        <div class="card-desc">${s.description}</div>
      </div>
    </div>`
    )
    .join('');

  els.cards.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.idx);
      selectedSuggestion = suggestions[idx];
      renderReveal();
      showView('reveal');
    });
  });
}

// 渲染揭示页
function renderReveal() {
  const s = selectedSuggestion;
  els.revealCard.innerHTML = `
    <span class="reveal-emoji">${s.emoji}</span>
    <div class="reveal-title">${s.title}</div>
    <div class="reveal-desc">${s.description}</div>
    <div class="reveal-encouragement">${s.encouragement}</div>
  `;

  els.scienceContent.innerHTML = `
    <div class="science-section">
      <div class="science-label">🍃 传统智慧</div>
      <div class="science-text">${s.science.traditional}</div>
    </div>
    <div class="science-section">
      <div class="science-label">🔬 现代科学</div>
      <div class="science-text">${s.science.modern}</div>
    </div>
  `;

  // 重置科学面板为折叠
  els.sciencePanel.classList.add('collapsed');
}

// 科学解释展开/收起
els.btnScience.addEventListener('click', () => {
  els.sciencePanel.classList.toggle('collapsed');
});

// 换个问题 / 再问一个
els.btnBackAsk.addEventListener('click', () => {
  els.inputQ.value = '';
  els.inputQ.dispatchEvent(new Event('input'));
  showView('asking');
});

els.btnAgain.addEventListener('click', () => {
  els.inputQ.value = '';
  els.inputQ.dispatchEvent(new Event('input'));
  showView('asking');
});

// 安全页返回
els.btnSafetyBack.addEventListener('click', () => {
  els.inputQ.value = '';
  els.inputQ.dispatchEvent(new Event('input'));
  showView('asking');
});

// 错误页重试
els.btnErrorRetry.addEventListener('click', () => showView('asking'));

// ---- 初始化 ----
initParticles();
