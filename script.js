// ==========================================================================
// SHUBHAM SHARMA — KINGDOM SCRIPTS & INTERACTIVE ENGINE
// 100% Self-Contained. Zero External JS Dependencies. Zero Build Steps.
// ==========================================================================

/* --------------------------------------------------------------------------
   1. PROCEDURAL WEB AUDIO SYNTHESIZER (NO EXTERNAL AUDIO FILES)
   -------------------------------------------------------------------------- */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = true;
    this.masterGain = null;
    this.windGain = null;
    this.emberInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  createWind() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    whiteNoise.start();
  }

  triggerEmberCrackle() {
    if (!this.ctx || this.isMuted) return;
    try {
      const crackleCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < crackleCount; i++) {
        const timeOffset = Math.random() * 0.2;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800 + Math.random() * 2400, this.ctx.currentTime + timeOffset);
        gain.gain.setValueAtTime(0.015, this.ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + timeOffset + 0.04);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + timeOffset);
        osc.stop(this.ctx.currentTime + timeOffset + 0.05);
      }
    } catch (_) {}
  }

  playSwordSound() {
    if (!this.ctx || this.isMuted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(2200, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.35);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch (_) {}
  }

  playWarHorn() {
    if (!this.ctx || this.isMuted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const t = this.ctx.currentTime;
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(55, t);
      sub.frequency.exponentialRampToValueAtTime(45, t + 2.5);
      subGain.gain.setValueAtTime(0.2, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);

      sub.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 3.1);
    } catch (_) {}
  }

  startAtmosphere() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.isMuted = false;
    this.isPlaying = true;
    this.createWind();
    if (!this.emberInterval) {
      this.emberInterval = setInterval(() => {
        if (!this.isMuted && Math.random() > 0.4) this.triggerEmberCrackle();
      }, 700);
    }
  }

  stopAtmosphere() {
    if (!this.ctx || !this.masterGain) return;
    this.isMuted = true;
    this.isPlaying = false;
    if (this.emberInterval) {
      clearInterval(this.emberInterval);
      this.emberInterval = null;
    }
  }

  toggleSound() {
    if (this.isMuted || !this.isPlaying) {
      this.startAtmosphere();
      this.playSwordSound();
      return true;
    } else {
      this.stopAtmosphere();
      return false;
    }
  }
}

const sound = new SoundEngine();

/* --------------------------------------------------------------------------
   2. CANVAS PARTICLE SYSTEM (FIRE EMBERS & WINTER SNOW)
   -------------------------------------------------------------------------- */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const emberCount = width < 768 ? 30 : 70;
  const snowCount = width < 768 ? 20 : 45;

  const embers = Array.from({ length: emberCount }, () => ({
    x: Math.random() * width,
    y: height + Math.random() * 100,
    size: Math.random() * 2.8 + 0.8,
    speedY: Math.random() * 1.4 + 0.6,
    speedX: (Math.random() - 0.5) * 0.8,
    opacity: Math.random() * 0.7 + 0.3,
    color: Math.random() > 0.4 ? 'rgba(198, 161, 91,' : 'rgba(215, 60, 40,',
    sway: Math.random() * Math.PI * 2,
  }));

  const snowflakes = Array.from({ length: snowCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2.2 + 0.6,
    speedY: Math.random() * 0.8 + 0.3,
    speedX: (Math.random() - 0.5) * 0.5,
    opacity: Math.random() * 0.5 + 0.2,
    sway: Math.random() * Math.PI * 2,
  }));

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Embers
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      p.y -= p.speedY;
      p.sway += 0.03;
      p.x += Math.sin(p.sway) * 0.5 + p.speedX;

      if (p.y < -20 || p.x < -20 || p.x > width + 20) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color} ${p.opacity})`;
      ctx.fill();
    }

    // Snow
    for (let j = 0; j < snowflakes.length; j++) {
      const s = snowflakes[j];
      s.y += s.speedY;
      s.sway += 0.02;
      s.x += Math.cos(s.sway) * 0.4 + s.speedX;

      if (s.y > height + 20) {
        s.y = -10;
        s.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 220, 245, ${s.opacity})`;
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}

/* --------------------------------------------------------------------------
   3. 7-STEP CINEMATIC INTRO EXPERIENCE
   -------------------------------------------------------------------------- */
let currentIntroStep = 1;
let introTimers = [];

function clearIntroTimers() {
  introTimers.forEach(t => clearTimeout(t));
  introTimers = [];
}

function showStep(stepNum) {
  currentIntroStep = stepNum;
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`intro-step-${i}`);
    if (el) el.classList.add('hidden');
  }

  const activeEl = document.getElementById(`intro-step-${stepNum}`);
  if (activeEl) {
    activeEl.classList.remove('hidden');
  }
}

function startCinematicProgression() {
  showStep(2);

  // Step 2 (1.8s) -> Step 3
  introTimers.push(setTimeout(() => {
    sound.playWarHorn();
    showStep(3);
  }, 1900));

  // Step 3 (2.2s) -> Step 4
  introTimers.push(setTimeout(() => {
    showStep(4);
  }, 4100));

  // Step 4 (1.9s) -> Step 5
  introTimers.push(setTimeout(() => {
    showStep(5);
  }, 6000));

  // Step 5 (2.0s) -> Step 6
  introTimers.push(setTimeout(() => {
    sound.playWarHorn();
    showStep(6);
  }, 8000));

  // Step 6 (2.6s) -> Step 7 (Complete & Fade)
  introTimers.push(setTimeout(() => {
    completeIntro();
  }, 10600));
}

function completeIntro() {
  clearIntroTimers();
  const overlay = document.getElementById('cinematicIntroOverlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.9s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 900);
  }
}

function replayIntro() {
  sound.playSwordSound();
  window.scrollTo({ top: 0, behavior: 'instant' });
  const overlay = document.getElementById('cinematicIntroOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.style.opacity = '1';
    showStep(1);
  }
}

/* --------------------------------------------------------------------------
   4. DAVINCI RESOLVE INTERACTIVE TIMELINE SCRUBBER
   -------------------------------------------------------------------------- */
let isTimelinePlaying = false;
let playheadPos = 35;
let timelineInterval = null;

function toggleTimelinePlay() {
  sound.playSwordSound();
  isTimelinePlaying = !isTimelinePlaying;
  const btn = document.getElementById('timelinePlayBtn');

  if (isTimelinePlaying) {
    btn.innerHTML = `<span>PAUSE TIMELINE</span>`;
    timelineInterval = setInterval(() => {
      playheadPos = playheadPos >= 98 ? 0 : playheadPos + 0.6;
      updatePlayheadUI();
    }, 50);
  } else {
    btn.innerHTML = `<span>SCRUB TIMELINE</span>`;
    clearInterval(timelineInterval);
  }
}

function resetTimeline() {
  sound.playSwordSound();
  playheadPos = 0;
  updatePlayheadUI();
}

function updatePlayheadUI() {
  const scrubber = document.getElementById('timelinePlayhead');
  if (scrubber) scrubber.style.left = `${playheadPos}%`;
}

/* --------------------------------------------------------------------------
   5. INTERACTIVE BEFORE / AFTER COLOR GRADING VIEWER
   -------------------------------------------------------------------------- */
function initColorGradingSlider() {
  const container = document.getElementById('colorGradingViewer');
  const divider = document.getElementById('colorGradeDivider');
  const flatLayer = document.getElementById('flatLogLayer');

  if (!container || !divider || !flatLayer) return;

  function setSplit(clientX) {
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    divider.style.left = `${percent}%`;
    flatLayer.style.width = `${percent}%`;
  }

  container.addEventListener('mousemove', (e) => setSplit(e.clientX));
  container.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) setSplit(e.touches[0].clientX);
  });
}

/* --------------------------------------------------------------------------
   6. INTERACTIVE 8x8 OBSIDIAN & GOLD CHESSBOARD
   -------------------------------------------------------------------------- */
const PIECES = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
};

const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

let chessBoardState = JSON.parse(JSON.stringify(INITIAL_BOARD));
let selectedSquare = null;
let currentTacticalStep = 0;

const TACTICAL_MOVES = [
  { move: "1. e4 e5", desc: "Open Game: Seizing central dominion with pawn structure." },
  { move: "2. Nf3 Nc6", desc: "Knight Deployment: Developing pieces toward critical squares." },
  { move: "3. Bc4 Bc5", desc: "Italian Game: Classical tension targeting the f7 flank." },
  { move: "4. c3 Nf6", desc: "Central Preparation: Forging a fortified pawn phalanx." },
  { move: "5. d4 exd4", desc: "Central Clash: Valyrian tactical breakthrough." },
];

function renderChessboard() {
  const container = document.getElementById('chessBoardGrid');
  if (!container) return;
  container.innerHTML = '';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = chessBoardState[r][c];
      const isDark = (r + c) % 2 === 1;
      const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
      const isWhite = piece && piece === piece.toUpperCase();

      const btn = document.createElement('button');
      btn.className = `flex items-center justify-center text-lg sm:text-xl font-bold transition-colors select-none ${
        isSelected
          ? 'bg-[#8B1717] ring-1 ring-[#C6A15B]'
          : isDark
          ? 'bg-[#15171F]'
          : 'bg-[#252A36]'
      }`;

      if (piece) {
        btn.innerHTML = `<span class="${isWhite ? 'text-[#E5C378] drop-shadow-[0_0_6px_rgba(198,161,91,0.6)]' : 'text-zinc-400'}">${PIECES[piece] || piece}</span>`;
      }

      btn.addEventListener('click', () => handleChessSquareClick(r, c));
      container.appendChild(btn);
    }
  }
}

function handleChessSquareClick(r, c) {
  sound.playSwordSound();
  if (selectedSquare) {
    const [sr, sc] = selectedSquare;
    if (sr === r && sc === c) {
      selectedSquare = null;
      renderChessboard();
      return;
    }
    chessBoardState[r][c] = chessBoardState[sr][sc];
    chessBoardState[sr][sc] = '';
    selectedSquare = null;
    renderChessboard();
  } else {
    if (chessBoardState[r][c] !== '') {
      selectedSquare = [r, c];
      renderChessboard();
    }
  }
}

function advanceTacticalMove() {
  sound.playSwordSound();
  currentTacticalStep = (currentTacticalStep + 1) % TACTICAL_MOVES.length;
  const newBoard = JSON.parse(JSON.stringify(INITIAL_BOARD));

  if (currentTacticalStep >= 1) {
    newBoard[6][4] = ''; newBoard[4][4] = 'P'; // e4
    newBoard[1][4] = ''; newBoard[3][4] = 'p'; // e5
  }
  if (currentTacticalStep >= 2) {
    newBoard[7][6] = ''; newBoard[5][5] = 'N'; // Nf3
    newBoard[0][1] = ''; newBoard[2][2] = 'n'; // Nc6
  }
  if (currentTacticalStep >= 3) {
    newBoard[7][5] = ''; newBoard[4][2] = 'B'; // Bc4
    newBoard[0][5] = ''; newBoard[3][2] = 'b'; // Bc5
  }
  if (currentTacticalStep >= 4) {
    newBoard[6][2] = ''; newBoard[5][2] = 'P'; // c3
    newBoard[0][6] = ''; newBoard[2][5] = 'n'; // Nf6
  }

  chessBoardState = newBoard;
  renderChessboard();

  const titleEl = document.getElementById('chessMoveTitle');
  const descEl = document.getElementById('chessMoveDesc');
  if (titleEl) titleEl.innerText = `${TACTICAL_MOVES[currentTacticalStep].move} (Step ${currentTacticalStep + 1}/5)`;
  if (descEl) descEl.innerText = TACTICAL_MOVES[currentTacticalStep].desc;
}

function resetChessboard() {
  sound.playSwordSound();
  chessBoardState = JSON.parse(JSON.stringify(INITIAL_BOARD));
  selectedSquare = null;
  currentTacticalStep = 0;
  renderChessboard();

  const titleEl = document.getElementById('chessMoveTitle');
  const descEl = document.getElementById('chessMoveDesc');
  if (titleEl) titleEl.innerText = `${TACTICAL_MOVES[0].move} (Step 1/5)`;
  if (descEl) descEl.innerText = TACTICAL_MOVES[0].desc;
}

/* --------------------------------------------------------------------------
   7. ANIMATED PERCENTAGE COUNTERS (90% & 85%)
   -------------------------------------------------------------------------- */
function initAnimatedCounters() {
  const elements = [
    { id: 'counter-10th', target: 90 },
    { id: 'counter-12th', target: 85 }
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        elements.forEach(item => {
          const el = document.getElementById(item.id);
          if (el && !el.dataset.animated) {
            el.dataset.animated = 'true';
            animateCounter(el, item.target);
          }
        });
      }
    });
  }, { threshold: 0.3 });

  const section = document.getElementById('victories');
  if (section) observer.observe(section);
}

function animateCounter(elem, endVal) {
  let start = null;
  const duration = 1800;
  function step(time) {
    if (!start) start = time;
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    elem.innerText = `${Math.floor(eased * endVal)}%`;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      elem.innerText = `${endVal}%`;
    }
  }
  requestAnimationFrame(step);
}

/* --------------------------------------------------------------------------
   8. PROJECT FILTERING & FORGE MODAL
   -------------------------------------------------------------------------- */
function filterProjects(category) {
  sound.playSwordSound();
  const cards = document.querySelectorAll('.project-card');
  const buttons = document.querySelectorAll('.project-filter-btn');

  buttons.forEach(btn => {
    if (btn.dataset.filter === category) {
      btn.className = "project-filter-btn px-4 py-2 rounded-lg font-cinzel text-xs font-semibold tracking-wider bg-[#C6A15B] text-black shadow-gold-glow";
    } else {
      btn.className = "project-filter-btn px-4 py-2 rounded-lg font-cinzel text-xs font-semibold tracking-wider bg-[#15171C] text-zinc-400 hover:text-white border border-zinc-800";
    }
  });

  cards.forEach(card => {
    const cat = card.dataset.category;
    const inForge = card.dataset.forge === 'true';

    if (category === 'all') {
      card.classList.remove('hidden');
    } else if (category === 'forge' && inForge) {
      card.classList.remove('hidden');
    } else if (category === 'ai' && (cat.includes('AI') || cat.includes('Software'))) {
      card.classList.remove('hidden');
    } else if (category === 'video' && cat.includes('Video')) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

function openForgeModal() {
  sound.playSwordSound();
  const modal = document.getElementById('forgeModal');
  if (modal) modal.classList.remove('hidden');
}

function closeForgeModal() {
  const modal = document.getElementById('forgeModal');
  if (modal) modal.classList.add('hidden');
}

function handleForgeSubmit(e) {
  e.preventDefault();
  sound.playWarHorn();

  const title = document.getElementById('forgeTitle').value;
  const category = document.getElementById('forgeCategory').value;
  const desc = document.getElementById('forgeDesc').value || "Newly forged creation in Shubham's digital kingdom.";
  const tech = document.getElementById('forgeTech').value || "Software, Code";

  const grid = document.getElementById('projectsGrid');
  if (grid) {
    const card = document.createElement('div');
    card.className = "project-card relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-[#13161F] border border-[#C6A15B]/60 shadow-xl shadow-gold-glow transition-all duration-500";
    card.dataset.category = category;
    card.dataset.forge = "true";

    card.innerHTML = `
      <div class="gilded-corner-tl"></div>
      <div class="gilded-corner-tr"></div>
      <div class="gilded-corner-bl"></div>
      <div class="gilded-corner-br"></div>
      <div>
        <div class="flex items-center justify-between mb-4">
          <span class="font-cinzel text-[11px] uppercase tracking-wider text-[#C6A15B]">${category}</span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-[#8B1717]/20 border border-[#8B1717]/50 text-[#FF8585]">
            <span>In The Royal Forge</span>
          </span>
        </div>
        <h3 class="font-cinzel text-xl sm:text-2xl font-bold text-white mb-2">${title}</h3>
        <p class="font-mono text-xs text-zinc-400 mb-4">Custom Creation</p>
        <p class="text-sm text-zinc-300 font-sans leading-relaxed mb-6">${desc}</p>
      </div>
      <div>
        <div class="flex flex-wrap gap-1.5 mb-6">
          <span class="px-2.5 py-1 rounded bg-[#1A1D27] border border-zinc-800 text-[11px] text-zinc-300 font-mono">${tech}</span>
        </div>
        <div class="pt-4 border-t border-zinc-800/80 flex items-center gap-3">
          <a href="https://github.com/shubhamsharma572007" target="_blank" class="flex-1 text-center py-2.5 rounded bg-[#181B24] border border-zinc-700 text-xs font-cinzel text-zinc-200">Repository</a>
          <a href="#projects" class="flex-1 text-center py-2.5 rounded bg-[#C6A15B] text-black text-xs font-cinzel font-bold">Details</a>
        </div>
      </div>
    `;

    grid.prepend(card);
  }

  closeForgeModal();
  document.getElementById('forgeForm').reset();
}

/* --------------------------------------------------------------------------
   9. CONTACT FORM VALIDATION & MAILTO
   -------------------------------------------------------------------------- */
function copyEmail() {
  sound.playSwordSound();
  navigator.clipboard.writeText("shubhamsharma572007@gmail.com");
  const label = document.getElementById('copyEmailLabel');
  if (label) {
    label.innerText = "Copied!";
    setTimeout(() => { label.innerText = "Copy"; }, 2500);
  }
}

function handleContactSubmit(e) {
  e.preventDefault();
  sound.playSwordSound();

  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();

  let hasError = false;

  if (!name) { document.getElementById('errorName').classList.remove('hidden'); hasError = true; }
  else { document.getElementById('errorName').classList.add('hidden'); }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('errorEmail').classList.remove('hidden');
    hasError = true;
  } else { document.getElementById('errorEmail').classList.add('hidden'); }

  if (!subject) { document.getElementById('errorSubject').classList.remove('hidden'); hasError = true; }
  else { document.getElementById('errorSubject').classList.add('hidden'); }

  if (!message || message.length < 10) { document.getElementById('errorMessage').classList.remove('hidden'); hasError = true; }
  else { document.getElementById('errorMessage').classList.add('hidden'); }

  if (!hasError) {
    sound.playWarHorn();
    const mailtoSubject = encodeURIComponent(`[Kingdom Dispatch] ${subject}`);
    const mailtoBody = encodeURIComponent(`Lord Shubham Sharma,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`);
    
    // Show transparent modal
    const modal = document.getElementById('dispatchModal');
    if (modal) {
      document.getElementById('dispatchModalInfo').innerHTML = `
        <div><strong>To:</strong> shubhamsharma572007@gmail.com</div>
        <div><strong>From:</strong> ${name} (${email})</div>
        <div><strong>Subject:</strong> ${subject}</div>
      `;
      modal.classList.remove('hidden');
    }

    // Set action on launcher button
    const launchBtn = document.getElementById('launchMailBtn');
    if (launchBtn) {
      launchBtn.onclick = () => {
        window.location.href = `mailto:shubhamsharma572007@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
      };
    }
  }
}

function closeDispatchModal() {
  const modal = document.getElementById('dispatchModal');
  if (modal) modal.classList.add('hidden');
}

/* --------------------------------------------------------------------------
   10. NAVBAR, SCROLL SPY & MOBILE DRAWER
   -------------------------------------------------------------------------- */
function toggleMobileMenu() {
  sound.playSwordSound();
  const menu = document.getElementById('mobileMenuDrawer');
  if (menu) menu.classList.toggle('hidden');
}

function handleNavClick(targetId) {
  sound.playSwordSound();
  const menu = document.getElementById('mobileMenuDrawer');
  if (menu) menu.classList.add('hidden');

  const elem = document.getElementById(targetId);
  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
}

function toggleSoundController() {
  const isNowActive = sound.toggleSound();
  const statusLabels = document.querySelectorAll('.sound-status-label');
  statusLabels.forEach(lbl => {
    lbl.innerText = isNowActive ? 'Sound On' : 'Muted';
  });
}

// Window load bootstrap
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initColorGradingSlider();
  renderChessboard();
  initAnimatedCounters();

  // Scroll spy
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('mainNavbar');
    if (navbar) {
      if (window.scrollY > 40) {
        navbar.classList.add('bg-[#08090C]/90', 'backdrop-blur-md', 'py-3', 'border-b', 'border-[#C6A15B]/20');
        navbar.classList.remove('py-5', 'bg-transparent');
      } else {
        navbar.classList.remove('bg-[#08090C]/90', 'backdrop-blur-md', 'py-3', 'border-b', 'border-[#C6A15B]/20');
        navbar.classList.add('py-5', 'bg-transparent');
      }
    }
  });
});
