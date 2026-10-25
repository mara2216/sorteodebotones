/**
 * Elige tu destino - Lógica del juego
 */

// Estado del juego y estadísticas
const gameState = {
  isPlaying: true,
  wins: 0,
  losses: 0,
  total: 0
};

// Referencias del DOM
const btnYellow = document.getElementById('btn-yellow') || document.getElementById('btn-red');
const btnBlue = document.getElementById('btn-blue');
const btnReset = document.getElementById('btn-reset');

const resultArea = document.getElementById('result-area');
const resultCard = document.getElementById('result-card');
const resultIconContainer = document.getElementById('result-icon-container');
const resultMessage = document.getElementById('result-message');
const resultDescription = document.getElementById('result-description');

const statWins = document.getElementById('stat-wins');
const statLosses = document.getElementById('stat-losses');
const statTotal = document.getElementById('stat-total');

const confettiCanvas = document.getElementById('confetti-canvas');

// ==========================================================================
// Efectos de Sonido Sintetizados (Web Audio API - Sin dependencias externas)
// ==========================================================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      // Manejo silencioso si el audio está bloqueado por el navegador
    }
  }

  playWin() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde mayor C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = this.ctx.currentTime + index * 0.09;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {}
  }

  playLose() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [311.13, 293.66, 277.18, 246.94]; // Secuencia descendente
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const startTime = this.ctx.currentTime + index * 0.1;
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {}
  }

  playHorn() {
    try {
      this.init();
      if (!this.ctx) return;
      // Bocina de coche sintetizada (dos beeps dual-tono)
      const playBeep = (timeOffset) => {
        [440, 554].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const start = this.ctx.currentTime + timeOffset;
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + 0.12);
        });
      };
      playBeep(0);
      playBeep(0.15);
    } catch (e) {}
  }
}

const sfx = new SoundFX();

// ==========================================================================
// Sistema Ligero de Confeti en Canvas
// ==========================================================================
class ConfettiManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.colors = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#ec4899', '#3b82f6'];

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.stop();
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: window.innerWidth / 2 + (Math.random() * 200 - 100),
        y: window.innerHeight * 0.45,
        size: Math.random() * 8 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() * -12) - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        gravity: 0.35,
        opacity: 1
      });
    }

    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let alive = false;

      this.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.007;

        if (p.opacity > 0 && p.y < this.canvas.height) {
          alive = true;
          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          this.ctx.restore();
        }
      });

      if (alive) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.stop();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

const confetti = new ConfettiManager(confettiCanvas);

// ==========================================================================
// Lógica Principal de Juego
// ==========================================================================

/**
 * Procesa la elección del usuario (botón amarillo o azul)
 * @param {'yellow' | 'blue'} chosenButton
 */
function handleChoice(chosenButton) {
  if (!gameState.isPlaying) return;

  // Marcar como no disponible hasta reiniciar
  gameState.isPlaying = false;
  btnYellow.disabled = true;
  btnBlue.disabled = true;

  // Efecto de sonido de clic
  sfx.playClick();

  // Determinar resultado aleatorio (50% de probabilidad)
  const isWinner = Math.random() < 0.5;

  // Actualizar estadísticas
  gameState.total++;
  if (isWinner) {
    gameState.wins++;
  } else {
    gameState.losses++;
  }
  updateStatsDisplay();

  // Mostrar el resultado
  displayResult(isWinner, chosenButton);
}

/**
 * Presenta el resultado en la interfaz
 * @param {boolean} isWinner 
 * @param {'yellow' | 'blue'} chosenButton 
 */
function displayResult(isWinner, chosenButton) {
  const buttonName = chosenButton === 'yellow' || chosenButton === 'red' ? 'Botón Amarillo' : 'Botón Azul';

  // Limpiar clases previas
  resultCard.classList.remove('result-win', 'result-lose');

  if (isWinner) {
    // Victoria
    resultCard.classList.add('result-win');
    resultIconContainer.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
    `;
    resultMessage.textContent = 'Has ganado';
    resultDescription.textContent = `¡Excelente elección! El ${buttonName} te ha llevado a la victoria.`;

    sfx.playWin();
    confetti.start();
  } else {
    // Derrota
    resultCard.classList.add('result-lose');
    resultIconContainer.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    `;
    resultMessage.textContent = 'Has perdido';
    resultDescription.textContent = `Mala suerte esta vez con el ${buttonName}. ¡Prueba de nuevo!`;

    sfx.playLose();
  }

  // Revelar la sección de resultados
  resultArea.classList.remove('hidden');

  // Llevar el foco al botón de reiniciar para facilitar accesibilidad por teclado
  btnReset.focus({ preventScroll: true });
}

/**
 * Reinicia la ronda para volver a jugar
 */
function resetGame() {
  sfx.playClick();
  confetti.stop();

  // Ocultar sección de resultado
  resultArea.classList.add('hidden');

  // Reactivar botones
  btnYellow.disabled = false;
  btnBlue.disabled = false;
  gameState.isPlaying = true;

  // Foco en el primer botón
  btnYellow.focus({ preventScroll: true });
}

/**
 * Actualiza el contador de estadísticas
 */
function updateStatsDisplay() {
  statWins.textContent = gameState.wins;
  statLosses.textContent = gameState.losses;
  statTotal.textContent = gameState.total;
}

// ==========================================================================
// Event Listeners
// ==========================================================================
btnYellow.addEventListener('click', () => handleChoice('yellow'));
btnBlue.addEventListener('click', () => handleChoice('blue'));
btnReset.addEventListener('click', resetGame);

// Accesibilidad mediante atajos de teclado
document.addEventListener('keydown', (e) => {
  // Tecla 'r' o 'R' para volver a jugar si la partida terminó
  if ((e.key === 'r' || e.key === 'R') && !gameState.isPlaying) {
    resetGame();
  }
});

// ==========================================================================
// Interacción con el Autito
// ==========================================================================
const littleCar = document.getElementById('little-car');
const hornBubble = document.getElementById('horn-bubble');
let hornTimeout = null;

if (littleCar) {
  littleCar.addEventListener('click', () => {
    sfx.playHorn();

    // Mostrar bocadillo animado
    if (hornBubble) {
      hornBubble.classList.add('active');
      clearTimeout(hornTimeout);
      hornTimeout = setTimeout(() => {
        hornBubble.classList.remove('active');
      }, 1400);
    }

    // Aceleración turbo temporal
    littleCar.classList.add('turbo');
    setTimeout(() => {
      littleCar.classList.remove('turbo');
    }, 2800);
  });
}
