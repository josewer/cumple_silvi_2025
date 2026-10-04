// =============================================================================
// MSN GAMES - ORQUESTADOR PRINCIPAL (PINCHI & CHIMPI)
// =============================================================================

// Elementos compartidos del modal de juegos
var gameModal = document.getElementById('gameModal');
var gameTitle = document.getElementById('gameTitle');
var gameContent = document.getElementById('gameContent');
var closeGameBtn = document.getElementById('closeGameBtn');

window.gameModal = gameModal;
window.gameTitle = gameTitle;
window.gameContent = gameContent;
window.closeGameBtn = closeGameBtn;

// Cierre y limpieza de bucles/timers activos de cualquier minijuego
function closeGameModal() {
  var modal = window.gameModal || document.getElementById('gameModal');
  if (modal) modal.style.display = 'none';
  if (window._gameInterval) {
    clearInterval(window._gameInterval);
    window._gameInterval = null;
  }
  if (window._spawnTimer) {
    clearInterval(window._spawnTimer);
    window._spawnTimer = null;
  }
  if (window._animFrame) {
    cancelAnimationFrame(window._animFrame);
    window._animFrame = null;
  }
}
window.closeGameModal = closeGameModal;

// Sintetizador de sonido retro (Web Audio API - 100% offline y sin librerías)
var retroAudioCtx = null;
function playRetroTone(freq, type, duration) {
  type = type || 'sine';
  duration = duration || 0.15;
  try {
    if (!retroAudioCtx) retroAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (retroAudioCtx.state === 'suspended') retroAudioCtx.resume();
    var osc = retroAudioCtx.createOscillator();
    var gain = retroAudioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, retroAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.18, retroAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, retroAudioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(retroAudioCtx.destination);
    osc.start();
    osc.stop(retroAudioCtx.currentTime + duration);
  } catch (e) {}
}
window.playRetroTone = playRetroTone;

// Botón estándar para regresar al Salón de Juegos desde cualquier minijuego
function hubBackBtnHtml() {
  return '<button class="msn-back-hub-btn" onclick="openGamesHub()">🔙 Volver a la Sala de Juegos</button>';
}
window.hubBackBtnHtml = hubBackBtnHtml;

// -----------------------------------------------------------------------------
// CATÁLOGO DE MINIJUEGOS MSN
// -----------------------------------------------------------------------------
var MSN_GAMES_CATALOG = [
  {
    id: 'penguin',
    title: 'Guerra de Pingüinos',
    desc: 'Duelo de bolas de nieve a contrarreloj',
    icon: '🐧',
    fn: 'openPenguinGame'
  },
  {
    id: 'memory',
    title: 'Reto de Memoria',
    desc: 'Duelo en directo 🐧 vs 🐷 o modo individual',
    icon: '🧠',
    fn: 'openMemoryGame'
  },
  {
    id: 'runner',
    title: 'Salto Antártico',
    desc: '¡Salta témpanos y atrapa 10 corazones!',
    icon: '🛷',
    fn: 'openRunnerGame'
  },
  {
    id: 'catcher',
    title: 'Lluvia de Regalos',
    desc: 'Desliza la cesta y atrapa los regalos',
    icon: '🎁',
    fn: 'openCatcherGame'
  },
  {
    id: 'scratch',
    title: 'Rasca y Gana de Cumple',
    desc: 'Rasca la nieve para descubrir tu sorpresa',
    icon: '✨',
    fn: 'openScratchGame'
  },
  {
    id: 'wheel',
    title: 'La Ruleta Millennial',
    desc: 'Gira y gana tus vales de regalo reales',
    icon: '🎡',
    fn: 'openWheelGame'
  },
  {
    id: 'tictactoe',
    title: 'Tres en Raya MSN',
    desc: 'Duelo oficial: Pinchi 🐧 vs Chimpi 🐷',
    icon: '❌⭕',
    fn: 'openTicTacToeGame'
  },
  {
    id: 'puzzle',
    title: 'Puzzle Deslizante',
    desc: 'Ordena las piezas de vuestra foto',
    icon: '🧩',
    fn: 'openPuzzleGame'
  },
  {
    id: 'simon',
    title: 'Simón Dice MSN',
    desc: 'Secuencia de luces y ritmo porcino',
    icon: '🎶',
    fn: 'openSimonGame'
  },
  {
    id: 'feedpig',
    title: 'Alimenta a Chimpi',
    desc: 'Lanza bellotas y jamón al cerdito',
    icon: '🍖',
    fn: 'openFeedPigGame'
  },
  {
    id: 'brick',
    title: 'Rompe-Ladrillos MSN',
    desc: 'Rebota bolas de nieve y rompe los bloques',
    icon: '🧱',
    fn: 'openBrickGame'
  },
  {
    id: 'hangman',
    title: 'Ahorcado Romántico',
    desc: '¡Salva la tarta antes de que Chimpi la coma!',
    icon: '🔤',
    fn: 'openHangmanGame'
  },
  {
    id: 'bubbles',
    title: 'Burbujas del Amor',
    desc: '¡Explota 20 burbujas antes de que escapen!',
    icon: '🫧',
    fn: 'openBubblePopGame'
  },
  {
    id: 'quiz',
    title: 'Test de Pareja',
    desc: '¿Quién conoce mejor a quién? Preguntas cómicas',
    icon: '💑',
    fn: 'openCoupleQuizGame'
  }
];

// -----------------------------------------------------------------------------
// SALÓN DE JUEGOS MSN (HUB CENTRAL)
// -----------------------------------------------------------------------------
function openGamesHub() {
  closeGameModal();

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '🎮 MSN Games - Salón de Juegos Retro';

  var cardsHtml = MSN_GAMES_CATALOG.map(function(g) {
    return (
      '<div class="game-hub-card" data-game-id="' + g.id + '">' +
        '<div class="game-hub-icon">' + g.icon + '</div>' +
        '<div class="game-hub-info">' +
          '<b>' + g.title + '</b>' +
          '<span>' + g.desc + '</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  if (content) {
    content.innerHTML =
      '<div style="font-size:14px;color:#333;margin-bottom:6px;">' +
        '¡Elige a qué minijuego quieres jugar con Chimpi el Cerdito! 🐧🐷✨' +
      '</div>' +
      '<div class="games-hub-grid">' +
        cardsHtml +
      '</div>';

    // Asignar listeners a cada tarjeta
    MSN_GAMES_CATALOG.forEach(function(g) {
      var card = content.querySelector('[data-game-id="' + g.id + '"]');
      if (card) {
        card.addEventListener('click', function() {
          playRetroTone(440, 'triangle', 0.08);

          // Si el juego soporta modo Live y estamos en conexión P2P activa
          var isLive = window._liveConnection && window._liveConnection.open;
          if (isLive && (g.id === 'tictactoe' || g.id === 'memory')) {
            showLiveGameChoice(g);
            return;
          }

          if (typeof window[g.fn] === 'function') {
            window[g.fn]();
          } else if (typeof window[g.fn] !== 'undefined') {
            window[g.fn]();
          } else {
            console.warn('Función no encontrada:', g.fn);
          }
        });
      }
    });
  }

  if (modal) modal.style.display = 'flex';
}
window.openGamesHub = openGamesHub;

function showLiveGameChoice(g) {
  var content = window.gameContent || document.getElementById('gameContent');
  var title = window.gameTitle || document.getElementById('gameTitle');
  if (title) title.textContent = g.icon + ' ' + g.title;

  var isChimpi = !!window._isChimpiMode;
  var opponent = isChimpi ? 'Pinchi 🐧' : 'Chimpi 🐷';

  if (content) {
    content.innerHTML =
      '<div style="text-align:center;padding:16px 8px;">' +
        '<div style="font-size:42px;margin-bottom:8px;">' + g.icon + '</div>' +
        '<div style="font-weight:bold;font-size:16px;color:#004a9f;margin-bottom:6px;">' + g.title + '</div>' +
        '<div style="font-size:13px;color:#444;margin-bottom:18px;max-width:300px;margin-left:auto;margin-right:auto;">' +
          '🟢 ¡Estás conectado en directo con <b>' + opponent + '</b>! ¿Cómo quieres jugar?' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;max-width:270px;margin:0 auto;">' +
          '<button class="msn-game-launch-btn" style="background:#28a745;padding:10px 14px;font-size:13px;font-weight:bold;" onclick="closeGameModal(); if(typeof window.sendLiveGameInvite === \'function\') window.sendLiveGameInvite(\'' + g.id + '\');">' +
            '📨 Enviar Invitación a ' + opponent +
          '</button>' +
          '<button class="msn-game-launch-btn" style="background:#6c757d;padding:8px 12px;font-size:12px;" onclick="window[\'' + g.fn + '\']();">' +
            '👤 Jugar en Solitario' +
          '</button>' +
        '</div>' +
        '<div style="margin-top:16px;">' +
          hubBackBtnHtml() +
        '</div>' +
      '</div>';
  }
}
window.showLiveGameChoice = showLiveGameChoice;

// Inicialización de botones y eventos
function initGamesHubOrchestrator() {
  window.gameModal = document.getElementById('gameModal');
  window.gameTitle = document.getElementById('gameTitle');
  window.gameContent = document.getElementById('gameContent');
  window.closeGameBtn = document.getElementById('closeGameBtn');

  var btn = document.getElementById('gamesHubBtn');
  if (btn) {
    btn.onclick = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      playRetroTone(400, 'sine', 0.1);
      openGamesHub();
    };
  }

  var closeBtn = window.closeGameBtn || document.getElementById('closeGameBtn');
  if (closeBtn) {
    closeBtn.onclick = closeGameModal;
  }
}

// Cerrar con Escape
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && window.gameModal && window.gameModal.style.display === 'flex') {
    closeGameModal();
  }
});

// Arrancar en cuanto el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGamesHubOrchestrator);
} else {
  initGamesHubOrchestrator();
}
