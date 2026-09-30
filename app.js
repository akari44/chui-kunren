// DEV_MODE: true にすると1分→5秒に短縮してテストできる
const DEV_MODE = true;
const STEP_DURATION = DEV_MODE ? 5 : 60; // 秒

const AUDIO_SETS = [
  {
    id: 1,
    audio: 'audio/set1.mp3',
    sounds: ['雨の音', '犬の鳴き声', '足音'],
    questions: [
      { sound: '雨の音',    correct: '右', options: ['右', '左'] },
      { sound: '犬の鳴き声', correct: '左', options: ['右', '左'] },
      { sound: '足音',      correct: '右', options: ['右', '左'] },
    ],
  },
  {
    id: 2,
    audio: 'audio/set2.mp3',
    sounds: ['波の音', '鳥の鳴き声', '電車の音'],
    questions: [
      { sound: '波の音',    correct: '左', options: ['右', '左'] },
      { sound: '鳥の鳴き声', correct: '右', options: ['右', '左'] },
      { sound: '電車の音',  correct: '左', options: ['右', '左'] },
    ],
  },
  {
    id: 3,
    audio: 'audio/set3.mp3',
    sounds: ['風の音', '猫の鳴き声', '拍手の音'],
    questions: [
      { sound: '風の音',    correct: '右', options: ['右', '左'] },
      { sound: '猫の鳴き声', correct: '右', options: ['右', '左'] },
      { sound: '拍手の音',  correct: '左', options: ['右', '左'] },
    ],
  },
];

const app = document.getElementById('app');
let state = {
  screen: 'home',
  set: null,
  stepIndex: 0,
  timeLeft: STEP_DURATION,
  timer: null,
  audio: null,
  quizIndex: 0,
  score: 0,
};

function pickRandomSet() {
  return AUDIO_SETS[Math.floor(Math.random() * AUDIO_SETS.length)];
}

function render() {
  if (state.screen === 'home')     renderHome();
  if (state.screen === 'training') renderTraining();
  if (state.screen === 'quiz')     renderQuiz();
  if (state.screen === 'complete') renderComplete();
}

// ========== HOME ==========
function renderHome() {
  if (!state.set) state.set = pickRandomSet();
  const s = state.set;

  app.innerHTML = `
    <div class="screen-home">
      <div class="home-title">注意トレーニング</div>
      <div class="home-sub">ひとつのことに「注意」を向ける力</div>
      <div class="today-card">
        <div class="today-label">今日の音</div>
        <div class="today-sounds">
          ${s.sounds.map(sound => `<span class="sound-badge">${sound}</span>`).join('')}
        </div>
      </div>
      <button class="btn-start" id="btnStart">スタート</button>
    </div>
  `;

  document.getElementById('btnStart').addEventListener('click', startTraining);
}

// ========== TRAINING ==========
function startTraining() {
  state.screen = 'training';
  state.stepIndex = 0;
  state.timeLeft = STEP_DURATION;
  render();
  tryPlayAudio();
  startTimer();
}

function tryPlayAudio() {
  if (state.audio) {
    state.audio.pause();
    state.audio = null;
  }
  const audio = new Audio(state.set.audio);
  audio.onerror = () => {}; // ダミー中はエラーを無視
  audio.play().catch(() => {});
  state.audio = audio;
}

function startTimer() {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      state.stepIndex++;
      if (state.stepIndex >= state.set.sounds.length) {
        clearInterval(state.timer);
        startQuiz();
        return;
      }
      state.timeLeft = STEP_DURATION;
    }
    renderTraining();
  }, 1000);
}

function renderTraining() {
  const s = state.set;
  const sound = s.sounds[state.stepIndex];
  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  const timeStr = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

  app.innerHTML = `
    <div class="screen-training">
      <div class="training-step">${state.stepIndex + 1} / ${s.sounds.length}</div>
      <div class="instruction-card">
        <div class="instruction-label">今、注意を向ける音</div>
        <div class="instruction-sound">${sound}</div>
        <div class="instruction-sub">どっちから聞こえる？</div>
      </div>
      <div class="timer-wrap">
        <div class="timer-display">${timeStr}</div>
        <div class="timer-label">残り時間</div>
      </div>
      <div class="progress-dots">
        ${s.sounds.map((_, i) => {
          let cls = 'dot';
          if (i < state.stepIndex) cls += ' done';
          if (i === state.stepIndex) cls += ' active';
          return `<div class="${cls}"></div>`;
        }).join('')}
      </div>
      ${DEV_MODE ? '<div class="dummy-note">⚠️ テストモード：1ステップ5秒 / 音声ファイルはダミー</div>' : ''}
    </div>
  `;
}

// ========== QUIZ ==========
function startQuiz() {
  if (state.audio) {
    state.audio.pause();
    state.audio = null;
  }
  state.screen = 'quiz';
  state.quizIndex = 0;
  state.score = 0;
  render();
}

function renderQuiz() {
  const q = state.set.questions[state.quizIndex];

  app.innerHTML = `
    <div class="screen-quiz">
      <div class="quiz-progress">問題 ${state.quizIndex + 1} / ${state.set.questions.length}</div>
      <div class="question-card">
        <div class="question-text">「${q.sound}」は<br>どちらから聞こえましたか？</div>
        <div class="question-sub"></div>
      </div>
      <div class="answer-buttons">
        ${q.options.map(opt => `
          <button class="btn-answer" data-answer="${opt}">
            <span class="btn-label">${opt}</span>
            <span class="btn-mark"></span>
          </button>
        `).join('')}
      </div>
      <button class="btn-next" id="btnNext">次へ</button>
    </div>
  `;

  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn, q.correct));
  });

  document.getElementById('btnNext').addEventListener('click', nextQuestion);
}

function handleAnswer(btn, correct) {
  document.querySelectorAll('.btn-answer').forEach(b => b.disabled = true);

  const nextBtn = document.getElementById('btnNext');
  const mark = btn.querySelector('.btn-mark');

  if (btn.dataset.answer === correct) {
    btn.classList.add('correct');
    mark.textContent = '○';
    state.score++;
  } else {
    btn.classList.add('wrong');
    mark.textContent = '×';
  }

  nextBtn.classList.add('visible');
}

function nextQuestion() {
  state.quizIndex++;
  if (state.quizIndex >= state.set.questions.length) {
    state.screen = 'complete';
    render();
  } else {
    renderQuiz();
  }
}

// ========== COMPLETE ==========
function renderComplete() {
  const total = state.set.questions.length;
  const score = state.score;

  app.innerHTML = `
    <div class="screen-complete">
      <div class="complete-icon">🎉</div>
      <div class="complete-title">お疲れさま！</div>
      <div class="complete-score">${total}問中 ${score}問 正解</div>
      <div class="complete-message">
        勉強もおなじ。<br>「注意をむけて」やろう。<br><br>
        <span>今できたことは、<br>きっと、できる！！</span>
      </div>
      <button class="btn-again" id="btnAgain">もう一度</button>
    </div>
  `;

  document.getElementById('btnAgain').addEventListener('click', () => {
    state.set = pickRandomSet();
    state.screen = 'home';
    render();
  });
}

// 初期表示
render();
