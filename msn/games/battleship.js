// =============================================================================
// MSN GAMES - HUNDIR LA FLOTA (BATALLA NAVAL RETRO: MODO INDIVIDUAL Y LIVE P2P)
// =============================================================================

(function () {
  const BOARD_SIZE = 6; // 6x6 = 36 casillas, óptimo y ágil para móviles y pantallas táctiles
  const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const COLS = ['1', '2', '3', '4', '5', '6'];

  const SHIPS_SPEC = [
    { id: 'flagship', name: 'Acorazado Insignia', size: 3, icon: '🚢' },
    { id: 'cruiser', name: 'Fragata Veloz', size: 2, icon: '🛥️' },
    { id: 'patrol', name: 'Lancha Guardacostas', size: 2, icon: '🚤' },
    { id: 'sub', name: 'Submarino Espía', size: 1, icon: '⚓' }
  ];

  // Generar cuadrícula naval aleatoria con barcos y colchón de agua obligatorio (zona de seguridad 1 casilla en 8 direcciones)
  function tryGenerateRandomFleet() {
    const board = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
    const ships = [];

    for (const spec of SHIPS_SPEC) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 150) {
        attempts++;
        const isHorizontal = Math.random() < 0.5;
        const maxR = isHorizontal ? BOARD_SIZE : BOARD_SIZE - spec.size + 1;
        const maxC = isHorizontal ? BOARD_SIZE - spec.size + 1 : BOARD_SIZE;
        if (maxR <= 0 || maxC <= 0) continue;

        const row = Math.floor(Math.random() * maxR);
        const col = Math.floor(Math.random() * maxC);

        const cells = [];
        let canPlace = true;

        for (let i = 0; i < spec.size; i++) {
          const r = isHorizontal ? row : row + i;
          const c = isHorizontal ? col + i : col;
          const idx = r * BOARD_SIZE + c;

          if (board[idx] !== null) {
            canPlace = false;
            break;
          }

          // Zona de seguridad de 1 casilla alrededor (horizontal, vertical y diagonal)
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                const nIdx = nr * BOARD_SIZE + nc;
                if (board[nIdx] !== null) {
                  canPlace = false;
                  break;
                }
              }
            }
            if (!canPlace) break;
          }

          if (!canPlace) break;
          cells.push(idx);
        }

        if (canPlace) {
          cells.forEach(idx => (board[idx] = spec.id));
          ships.push({
            id: spec.id,
            name: spec.name,
            size: spec.size,
            icon: spec.icon,
            cells: cells,
            hits: []
          });
          placed = true;
        }
      }

      if (!placed) {
        return null; // Reiniciar intento completo de tablero para no quedar en callejón sin salida
      }
    }

    return { board, ships };
  }

  function getFallbackSafeFleet() {
    // Configuración determinista de emergencia garantizada con colchón de agua total
    const board = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
    const ships = [
      { id: 'flagship', name: 'Acorazado Insignia', size: 3, icon: '🚢', cells: [0, 1, 2], hits: [] },
      { id: 'cruiser', name: 'Fragata Veloz', size: 2, icon: '🛥️', cells: [5, 11], hits: [] },
      { id: 'patrol', name: 'Lancha Guardacostas', size: 2, icon: '🚤', cells: [19, 20], hits: [] },
      { id: 'sub', name: 'Submarino Espía', size: 1, icon: '⚓', cells: [34], hits: [] }
    ];
    ships.forEach(s => s.cells.forEach(idx => (board[idx] = s.id)));
    return { board, ships };
  }

  function generateRandomFleet() {
    for (let attempt = 0; attempt < 300; attempt++) {
      const fleet = tryGenerateRandomFleet();
      if (fleet) return fleet;
    }
    return getFallbackSafeFleet();
  }

  // Sonidos navales retro usando Web Audio API sintetizado
  function playSonarPing() {
    try {
      if (typeof playRetroTone === 'function') {
        playRetroTone(880, 'sine', 0.22);
        setTimeout(() => playRetroTone(1200, 'sine', 0.15), 180);
      }
    } catch (e) {}
  }

  function playWaterSplash() {
    try {
      if (typeof playRetroTone === 'function') {
        playRetroTone(190, 'sine', 0.12);
        setTimeout(() => playRetroTone(130, 'sine', 0.2), 70);
      }
    } catch (e) {}
  }

  function playExplosionHit() {
    try {
      if (typeof playRetroTone === 'function') {
        playRetroTone(140, 'triangle', 0.25);
        setTimeout(() => playRetroTone(90, 'sawtooth', 0.35), 80);
      }
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 120]); } catch (e) {}
    } catch (e) {}
  }

  function playShipSunkFanfare() {
    try {
      if (typeof playRetroTone === 'function') {
        playRetroTone(300, 'triangle', 0.12);
        setTimeout(() => playRetroTone(420, 'triangle', 0.14), 100);
        setTimeout(() => playRetroTone(580, 'triangle', 0.28), 220);
      }
      if (navigator.vibrate) try { navigator.vibrate([120, 60, 180]); } catch (e) {}
    } catch (e) {}
  }

  function sendLiveMsg(data) {
    try {
      if (window._liveConnection && window._liveConnection.open) {
        window._liveConnection.send(data);
      }
    } catch (e) {
      console.warn('Error al transmitir datos de Batalla Naval por WebRTC:', e);
    }
  }

  function openBattleshipGame(forceSolo) {
    if (typeof closeGameModal === 'function') closeGameModal(true);

    var modal = window.gameModal || document.getElementById('gameModal');
    var title = window.gameTitle || document.getElementById('gameTitle');
    var content = window.gameContent || document.getElementById('gameContent');

    if (title) title.textContent = '🚢 MSN Games - Hundir la Flota: Batalla Naval';

    if (modal) {
      var win = modal.querySelector('.game-window');
      if (win) win.style.maxWidth = '520px';
    }
    if (content) {
      content.style.padding = '8px 10px';
      content.style.gap = '4px';
      content.style.overflowY = 'hidden';
      content.style.maxHeight = '95vh';
    }

    const isLive = !forceSolo && !!(window._liveConnection && window._liveConnection.open);
    const isChimpi = !!window._isChimpiMode;
    const myName = isChimpi ? 'Chimpi' : 'Pinchi';
    const mySymbol = isChimpi ? '🐷' : '🐧';
    const opponentName = isChimpi ? 'Pinchi' : 'Chimpi';
    const opponentSymbol = isChimpi ? '🐧' : '🐷';

    window._activeLiveGame = isLive ? 'Hundir la Flota' : null;

    // Estado del juego local
    let myFleet = generateRandomFleet();
    let myReady = false;
    let opponentReady = false;
    let gameStarted = false;
    let gameOver = false;
    let currentTurn = null; // Se sortea aleatoriamente al comenzar la batalla

    // Registro de cuadrículas de disparos
    // attackRadar[idx]: null | 'water' | 'hit' | 'sunk'
    const attackRadar = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
    // defenseShotsReceived[idx]: null | 'water' | 'hit' | 'sunk'
    const defenseShotsReceived = Array(BOARD_SIZE * BOARD_SIZE).fill(null);

    // IA Offline (Chimpi el Cerdito)
    let aiFleet = isLive ? null : generateRandomFleet();
    let aiAttackPool = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i);
    let aiTargetQueue = [];

    function renderMainLayout() {
      if (!content) return;

      content.innerHTML = `
        <style>
          @keyframes bs-fire-pulse {
            0% { transform: scale(1); filter: drop-shadow(0 0 2px #ffeb3b); }
            50% { transform: scale(1.08); filter: drop-shadow(0 0 6px #ff5722); }
            100% { transform: scale(1); filter: drop-shadow(0 0 2px #ff9800); }
          }
          @keyframes bs-sunk-pulse {
            0% { transform: scale(0.9); }
            50% { transform: scale(1.1); filter: drop-shadow(0 0 8px #ff1744); }
            100% { transform: scale(1); }
          }
          .bs-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            color: #111;
            font-family: inherit;
            box-sizing: border-box;
          }
          .bs-header {
            text-align: center;
            margin-bottom: 2px;
          }
          .bs-status-badge {
            font-size: 11px;
            font-weight: bold;
            padding: 3px 8px;
            border-radius: 6px;
            margin: 2px 0 4px 0;
            display: inline-block;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          }
          .bs-boards-wrapper {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: flex-start;
            gap: 10px;
            width: 100%;
            margin: 2px 0;
          }
          @media (max-width: 460px) {
            .bs-boards-wrapper {
              gap: 6px;
            }
          }
          .bs-board-card {
            background: #f8fbff;
            border: 1.5px solid #a4c9f5;
            border-radius: 8px;
            padding: 5px 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            text-align: center;
            box-sizing: border-box;
          }
          .bs-board-title {
            font-size: 11px;
            font-weight: bold;
            color: #004a9f;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            white-space: nowrap;
          }
          .bs-grid {
            display: grid;
            grid-template-columns: repeat(6, 28px);
            grid-template-rows: repeat(6, 28px);
            gap: 2.5px;
            background: #002b5c;
            padding: 3px;
            border-radius: 6px;
            box-shadow: inset 0 0 6px rgba(0,0,0,0.5);
          }
          @media (max-width: 440px) {
            .bs-grid {
              grid-template-columns: repeat(6, 25px);
              grid-template-rows: repeat(6, 25px);
              gap: 2px;
            }
          }
          .bs-cell {
            background: #0f4c81;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            cursor: pointer;
            user-select: none;
            transition: background 0.15s, transform 0.1s;
          }
          .bs-cell:hover:not(.shot) {
            background: #196fba;
            transform: scale(1.05);
          }
          .bs-cell.water {
            background: #2574a9 !important;
            box-shadow: inset 0 0 3px rgba(0,0,0,0.2);
            cursor: default;
          }
          .bs-cell.hit {
            background: linear-gradient(135deg, #ff6b35, #e64a19) !important;
            box-shadow: 0 0 6px #ff5722, inset 0 0 3px rgba(0,0,0,0.3) !important;
            border: 1px solid #ffab91;
            animation: bs-fire-pulse 1s infinite alternate;
            cursor: default;
          }
          .bs-cell.sunk {
            background: linear-gradient(135deg, #b71c1c, #263238) !important;
            box-shadow: 0 0 8px rgba(255, 23, 68, 0.8), inset 0 0 4px rgba(0,0,0,0.6) !important;
            border: 1.5px solid #ff5252 !important;
            animation: bs-sunk-pulse 0.5s ease-out;
            cursor: default;
          }
          .bs-cell.ship {
            background: #2ecc71;
            box-shadow: inset 0 0 3px rgba(0,0,0,0.3);
          }
          .bs-actions {
            margin-top: 6px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
          }
          .bs-actions .msn-game-launch-btn {
            padding: 4px 10px !important;
            font-size: 11px !important;
          }
        </style>

        <div class="bs-container">
          <div class="bs-header">
            <div style="font-weight:bold;font-size:14px;">
              🚢 Hundir la Flota: Pinchi (🐧) vs Chimpi (🐷)
            </div>
            <div id="bsSubHeader" style="font-size:11px;color:#555;">
              ${isLive ? '<b style="color:#28a745;">🟢 ¡BATALLA NAVAL EN DIRECTO REAL!</b>' : '👤 Modo Entrenamiento vs Chimpi (IA)'}
            </div>
            <div id="bsStatusBadge" class="bs-status-badge" style="background:#eef6ff;color:#0078d7;border:1px solid #70a1ff;">
              ⚓ Fase 1: Posiciona tu flota naval
            </div>
          </div>

          <div id="bsSetupControls" style="margin-bottom:4px;text-align:center;">
            <div style="font-size:11px;color:#444;margin-bottom:4px;">
              Reorganiza tus 4 barcos con el botón o confirma para empezar:
            </div>
            <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
              <button id="bsRerollFleetBtn" class="msn-game-launch-btn" style="padding:4px 10px;font-size:11px;background:#17a2b8;">
                🎲 Barajar Flota
              </button>
              <button id="bsReadyBtn" class="msn-game-launch-btn" style="padding:5px 12px;font-size:12px;font-weight:bold;background:#28a745;">
                ⚓ ¡Zarpar a la Batalla!
              </button>
            </div>
          </div>

          <div class="bs-boards-wrapper">
            <!-- Tablero 1: Radar de Ataque (contra el enemigo) -->
            <div class="bs-board-card" id="bsRadarCard" style="display:none;">
              <div class="bs-board-title">
                🎯 Radar de Ataque (${opponentName} ${opponentSymbol})
              </div>
              <div class="bs-grid" id="bsRadarGrid"></div>
              <div style="font-size:10px;color:#666;margin-top:3px;">
                Toca una casilla para disparar torpedo 🚀
              </div>
            </div>

            <!-- Tablero 2: Tu Flota Defensiva -->
            <div class="bs-board-card" id="bsDefenseCard">
              <div class="bs-board-title">
                🛡️ Tu Flota (${myName} ${mySymbol})
              </div>
              <div class="bs-grid" id="bsDefenseGrid"></div>
              <div id="bsDefenseSubtext" style="font-size:10px;color:#666;margin-top:3px;">
                4 barcos preparados (8 casillas)
              </div>
            </div>
          </div>

          <div class="bs-actions">
            <button class="msn-game-launch-btn" style="background:#6c757d;" onclick="if(window.restartLiveBattleshipGame) window.restartLiveBattleshipGame(); else openBattleshipGame();">
              Reiniciar Batalla 🔄
            </button>
            ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
          </div>
        </div>
      `;

      bindSetupEvents();
      drawDefenseBoard();
    }

    function bindSetupEvents() {
      const rerollBtn = document.getElementById('bsRerollFleetBtn');
      if (rerollBtn) {
        rerollBtn.onclick = () => {
          if (myReady || gameStarted) return;
          myFleet = generateRandomFleet();
          drawDefenseBoard();
          playSonarPing();
        };
      }

      const readyBtn = document.getElementById('bsReadyBtn');
      if (readyBtn) {
        readyBtn.onclick = () => {
          if (myReady) return;
          myReady = true;
          readyBtn.disabled = true;
          readyBtn.style.opacity = '0.6';
          readyBtn.innerHTML = '✅ Flota Lista (Esperando)';
          playSonarPing();

          if (isLive) {
            // Notificar al rival vía WebRTC
            sendLiveMsg({ type: 'bs_ready' });
            updateLiveStatusBadge();
            checkBothReady();
          } else {
            // Modo solitario: IA siempre lista de inmediato
            opponentReady = true;
            checkBothReady();
          }
        };
      }
    }

    function updateLiveStatusBadge() {
      const badge = document.getElementById('bsStatusBadge');
      if (!badge) return;

      if (!gameStarted) {
        if (myReady && !opponentReady) {
          badge.style.background = '#fff3cd';
          badge.style.color = '#856404';
          badge.style.borderColor = '#ffeeba';
          badge.innerHTML = `⏳ Esperando a que <b>${opponentName}</b> confirme su flota...`;
        } else if (!myReady && opponentReady) {
          badge.style.background = '#d1ecf1';
          badge.style.color = '#0c5460';
          badge.style.borderColor = '#bee5eb';
          badge.innerHTML = `🔔 ¡<b>${opponentName}</b> ya está listo! Confirma tu flota para zarpar.`;
        }
      } else {
        updateBattleTurnUI(false);
      }
    }

    function checkBothReady() {
      if (myReady && opponentReady && !gameStarted) {
        gameStarted = true;
        playSonarPing();

        // 1. Elección aleatoria de quién abre fuego (50% Pinchi 🐧 / 50% Chimpi 🐷)
        if (isLive) {
          if (!isChimpi) {
            // Pinchi (anfitriona) realiza el sorteo y lo transmite al rival por WebRTC
            currentTurn = Math.random() < 0.5 ? '🐧' : '🐷';
            sendLiveMsg({ type: 'bs_start_turn', firstTurn: currentTurn });
          }
        } else {
          // Modo offline vs IA
          currentTurn = Math.random() < 0.5 ? '🐧' : '🐷';
        }

        // Ocultar controles de preparación y mostrar radar de ataque
        const setupControls = document.getElementById('bsSetupControls');
        if (setupControls) setupControls.style.display = 'none';

        const radarCard = document.getElementById('bsRadarCard');
        if (radarCard) radarCard.style.display = 'block';

        const defenseSubtext = document.getElementById('bsDefenseSubtext');
        if (defenseSubtext) defenseSubtext.textContent = 'Observa los torpedos del rival aquí 🌊';

        drawRadarBoard();
        updateBattleTurnUI(true);

        // Si en solitario el sorteo favorece a Chimpi IA, Chimpi abre fuego
        if (!isLive && currentTurn === '🐷') {
          setTimeout(aiTakeTurn, 1200);
        }
      }
    }

    function updateBattleTurnUI(isInitial) {
      const badge = document.getElementById('bsStatusBadge');
      if (!badge || gameOver) return;

      if (!currentTurn) {
        badge.style.background = '#eef6ff';
        badge.style.color = '#0078d7';
        badge.style.borderColor = '#70a1ff';
        badge.innerHTML = `🎲 Sorteando turno de combate...`;
        return;
      }

      const isMyTurn = currentTurn === mySymbol;
      const starterPrefix = isInitial ? '🎲 <b>¡Sorteo inicial!</b> ' : '';

      if (isMyTurn) {
        badge.style.background = '#d4edda';
        badge.style.color = '#155724';
        badge.style.borderColor = '#c3e6cb';
        badge.innerHTML = `${starterPrefix}✨ <b>¡Tu turno de disparo, ${myName}!</b> Elige una coordenada en el radar 🎯`;
      } else {
        badge.style.background = '#f8f9fa';
        badge.style.color = '#6c757d';
        badge.style.borderColor = '#dee2e6';
        badge.innerHTML = `${starterPrefix}⏳ <b>Turno de ${opponentName} ${opponentSymbol}</b> (Apuntando sus torpedos...)`;
      }
    }

    // Dibujar tablero propio con barcos
    function drawDefenseBoard() {
      const grid = document.getElementById('bsDefenseGrid');
      if (!grid) return;
      grid.innerHTML = '';

      for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'bs-cell';
        const shipId = myFleet.board[i];
        const shotState = defenseShotsReceived[i];

        if (shotState === 'sunk') {
          cell.className += ' sunk';
          cell.innerHTML = '💥';
        } else if (shotState === 'hit') {
          cell.className += ' hit';
          cell.innerHTML = '🔥';
        } else if (shotState === 'water') {
          cell.className += ' water';
          cell.innerHTML = '💧';
        } else if (shipId) {
          cell.className += ' ship';
          cell.innerHTML = shipId === 'flagship' ? '🚢' : (shipId === 'sub' ? '⚓' : '⛵');
        } else {
          cell.innerHTML = '';
        }
        grid.appendChild(cell);
      }
    }

    // Dibujar radar de ataque
    function drawRadarBoard() {
      const grid = document.getElementById('bsRadarGrid');
      if (!grid) return;
      grid.innerHTML = '';

      for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'bs-cell';
        const shot = attackRadar[i];

        if (shot === 'sunk') {
          cell.className += ' sunk';
          cell.innerHTML = '💥';
        } else if (shot === 'hit') {
          cell.className += ' hit';
          cell.innerHTML = '🔥';
        } else if (shot === 'water') {
          cell.className += ' water';
          cell.innerHTML = '💧';
        } else {
          cell.innerHTML = '';
          cell.addEventListener('click', () => handlePlayerShot(i));
        }
        grid.appendChild(cell);
      }
    }

    // Procesar disparo del jugador local
    function handlePlayerShot(idx) {
      if (!gameStarted || gameOver) return;
      if (currentTurn !== mySymbol) return;
      if (attackRadar[idx] !== null) return;

      if (isLive) {
        // Enviar disparo al rival por WebRTC
        sendLiveMsg({
          type: 'bs_shot',
          cellIdx: idx,
          shooter: mySymbol
        });
      } else {
        // Modo offline contra Chimpi IA
        evaluateShotAgainstAiFleet(idx);
      }
    }

    // Evaluación en modo offline
    function evaluateShotAgainstAiFleet(idx) {
      const shipId = aiFleet.board[idx];
      let result = 'water';
      let sunkShipName = null;
      let sunkShipCells = null;

      if (shipId) {
        result = 'hit';
        attackRadar[idx] = 'hit';
        const shipObj = aiFleet.ships.find(s => s.id === shipId);
        if (shipObj) {
          shipObj.hits.push(idx);
          if (shipObj.hits.length === shipObj.size) {
            result = 'sunk';
            sunkShipName = shipObj.name;
            sunkShipCells = shipObj.cells;
            // Todas las casillas del barco pasan a estado 'sunk'
            shipObj.cells.forEach(c => (attackRadar[c] = 'sunk'));
          }
        }
      } else {
        attackRadar[idx] = 'water';
      }

      applyShotResultOnRadar(idx, result, sunkShipName, sunkShipCells);

      // Comprobar fin de partida offline
      const allSunk = aiFleet.ships.every(s => s.hits.length === s.size);
      if (allSunk) {
        handleGameOver('🐧');
        return;
      }

      // Si fue agua, pasa el turno a Chimpi IA; si fue tocado/hundido, el jugador repite disparo
      if (result === 'water') {
        currentTurn = '🐷';
        updateBattleTurnUI(false);
        setTimeout(aiTakeTurn, 1000);
      }
    }

    function applyShotResultOnRadar(idx, result, sunkShipName, sunkShipCells) {
      if (result === 'sunk') {
        if (Array.isArray(sunkShipCells)) {
          sunkShipCells.forEach(c => (attackRadar[c] = 'sunk'));
        } else {
          attackRadar[idx] = 'sunk';
        }
      } else if (result === 'hit') {
        attackRadar[idx] = 'hit';
      } else {
        attackRadar[idx] = 'water';
      }

      drawRadarBoard();

      if (result === 'water') {
        playWaterSplash();
        const badge = document.getElementById('bsStatusBadge');
        if (badge && !gameOver) {
          badge.style.background = '#eef6ff';
          badge.style.color = '#0056b3';
          badge.style.borderColor = '#b8daff';
          badge.innerHTML = `💧 ¡Agua! El torpedo cayó al mar. Pasa el turno.`;
        }
      } else if (result === 'sunk') {
        playShipSunkFanfare();
        const badge = document.getElementById('bsStatusBadge');
        if (badge && !gameOver) {
          badge.style.background = '#f8d7da';
          badge.style.color = '#721c24';
          badge.style.borderColor = '#f5c6cb';
          badge.innerHTML = `💥 ¡HUNDIDO! ¡Has destruido el <b>${sunkShipName || 'barco'}</b> enemigo! 🚀 Repites turno.`;
        }
      } else {
        playExplosionHit();
        const badge = document.getElementById('bsStatusBadge');
        if (badge && !gameOver) {
          badge.style.background = '#fff3cd';
          badge.style.color = '#856404';
          badge.style.borderColor = '#ffeeba';
          badge.innerHTML = `🔥 ¡TOCADO! ¡Fuego en un barco enemigo! 🚀 Repites turno.`;
        }
      }
    }

    // Turno de la IA en solitario (Chimpi 🐷)
    function aiTakeTurn() {
      if (gameOver) return;

      let targetIdx = -1;
      if (aiTargetQueue.length > 0) {
        targetIdx = aiTargetQueue.shift();
      } else {
        const randomPos = Math.floor(Math.random() * aiAttackPool.length);
        targetIdx = aiAttackPool.splice(randomPos, 1)[0];
      }

      if (targetIdx === undefined || defenseShotsReceived[targetIdx] !== null) {
        if (aiAttackPool.length > 0) aiTakeTurn();
        return;
      }

      const shipId = myFleet.board[targetIdx];
      let result = 'water';
      let sunkShipName = null;

      if (shipId) {
        result = 'hit';
        defenseShotsReceived[targetIdx] = 'hit';

        const shipObj = myFleet.ships.find(s => s.id === shipId);
        if (shipObj) {
          shipObj.hits.push(targetIdx);
          if (shipObj.hits.length === shipObj.size) {
            result = 'sunk';
            sunkShipName = shipObj.name;
            // Marcar todas las casillas del barco hundido como 'sunk'
            shipObj.cells.forEach(c => (defenseShotsReceived[c] = 'sunk'));
            playShipSunkFanfare();
          } else {
            playExplosionHit();
          }
        } else {
          playExplosionHit();
        }

        // Si acierta, busca en las 4 direcciones vecinas
        const r = Math.floor(targetIdx / BOARD_SIZE);
        const c = targetIdx % BOARD_SIZE;
        const neighbors = [
          r > 0 ? (r - 1) * BOARD_SIZE + c : null,
          r < BOARD_SIZE - 1 ? (r + 1) * BOARD_SIZE + c : null,
          c > 0 ? r * BOARD_SIZE + (c - 1) : null,
          c < BOARD_SIZE - 1 ? r * BOARD_SIZE + (c + 1) : null
        ].filter(n => n !== null && defenseShotsReceived[n] === null);

        aiTargetQueue.push(...neighbors);
      } else {
        defenseShotsReceived[targetIdx] = 'water';
        playWaterSplash();
      }

      drawDefenseBoard();

      // Comprobar si toda la flota del jugador ha sido destruida
      const myAllSunk = myFleet.ships.every(s =>
        s.cells.every(c => defenseShotsReceived[c] === 'sunk' || defenseShotsReceived[c] === 'hit')
      );

      if (myAllSunk) {
        handleGameOver('🐷');
        return;
      }

      if (result === 'hit' || result === 'sunk') {
        const badge = document.getElementById('bsStatusBadge');
        if (badge && !gameOver) {
          if (result === 'sunk') {
            badge.style.background = '#f8d7da';
            badge.style.color = '#721c24';
            badge.style.borderColor = '#f5c6cb';
            badge.innerHTML = `💥 ¡Chimpi ha hundido tu <b>${sunkShipName || 'barco'}</b>! 🐷 Chimpi repite turno...`;
          } else {
            badge.style.background = '#fff3cd';
            badge.style.color = '#856404';
            badge.style.borderColor = '#ffeeba';
            badge.innerHTML = `🔥 ¡Chimpi ha tocado uno de tus barcos! 🐷 Chimpi repite turno...`;
          }
        }
        // La IA repite turno al acertar o hundir
        setTimeout(aiTakeTurn, 1000);
      } else {
        // Vuelve el turno a Pinchi
        currentTurn = '🐧';
        updateBattleTurnUI(false);
      }
    }

    // Fin de partida
    function handleGameOver(winnerSymbol) {
      gameOver = true;
      window._activeLiveGame = null;

      const badge = document.getElementById('bsStatusBadge');
      const isWinner = winnerSymbol === mySymbol;

      if (badge) {
        badge.style.display = 'block';
        if (isWinner) {
          badge.style.background = '#d4edda';
          badge.style.color = '#155724';
          badge.style.borderColor = '#c3e6cb';
          badge.innerHTML = `🏆 <b>¡VICTORIA NAVAL!</b> Has hundido toda la flota enemiga 🎉`;
        } else {
          badge.style.background = '#f8d7da';
          badge.style.color = '#721c24';
          badge.style.borderColor = '#f5c6cb';
          badge.innerHTML = `⚓ <b>¡FLOTA HUNDIDA!</b> ${opponentName} ha salido victorioso en esta batalla.`;
        }
      }

      // REGLA CRÍTICA: Confeti ÚNICAMENTE para quien gana, jamás para quien pierde
      if (isWinner) {
        if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
        if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 300]); } catch (e) {}
      } else {
        if (typeof playRetroTone === 'function') playRetroTone(180, 'sine', 0.35);
      }
    }

    // Escuchadores de eventos WebRTC entrantes para Battleship
    window._handleRemoteBattleshipReady = function () {
      opponentReady = true;
      updateLiveStatusBadge();
      checkBothReady();
    };

    window._handleRemoteBattleshipStartTurn = function (data) {
      if (data && data.firstTurn) {
        currentTurn = data.firstTurn;
        updateBattleTurnUI(true);
      }
    };

    window._handleRemoteBattleshipShot = function (data) {
      if (!gameStarted || gameOver) return;
      const idx = data.cellIdx;
      const shipId = myFleet.board[idx];
      let result = 'water';
      let sunkShipName = null;
      let sunkShipCells = null;

      if (shipId) {
        result = 'hit';
        defenseShotsReceived[idx] = 'hit';
        const shipObj = myFleet.ships.find(s => s.id === shipId);
        if (shipObj) {
          shipObj.hits.push(idx);
          if (shipObj.hits.length === shipObj.size) {
            result = 'sunk';
            sunkShipName = shipObj.name;
            sunkShipCells = shipObj.cells;
            shipObj.cells.forEach(c => (defenseShotsReceived[c] = 'sunk'));
            playShipSunkFanfare();
          } else {
            playExplosionHit();
          }
        } else {
          playExplosionHit();
        }
      } else {
        defenseShotsReceived[idx] = 'water';
        playWaterSplash();
      }

      drawDefenseBoard();

      const allMySunk = myFleet.ships.every(s =>
        s.cells.every(c => defenseShotsReceived[c] === 'sunk' || defenseShotsReceived[c] === 'hit')
      );

      // Siguiente turno: si acierta repite el tirador; si falla, pasa al defensor
      const nextTurn = result === 'water' ? mySymbol : opponentSymbol;
      currentTurn = nextTurn;

      // Responder al tirador con el resultado del impacto
      sendLiveMsg({
        type: 'bs_shot_result',
        cellIdx: idx,
        result: result,
        sunkShipName: sunkShipName,
        sunkShipCells: sunkShipCells,
        allSunk: allMySunk,
        nextTurn: nextTurn
      });

      if (allMySunk) {
        handleGameOver(opponentSymbol);
      } else {
        updateBattleTurnUI(false);
      }
    };

    window._handleRemoteBattleshipShotResult = function (data) {
      if (!gameStarted || gameOver) return;
      applyShotResultOnRadar(data.cellIdx, data.result, data.sunkShipName, data.sunkShipCells);

      if (data.allSunk) {
        handleGameOver(mySymbol);
      } else {
        currentTurn = data.nextTurn;
        updateBattleTurnUI(false);
      }
    };

    // Renderizar e iniciar la interfaz del juego
    renderMainLayout();

    // HACER VISIBLE EL MODAL DE JUEGO (CRÍTICO)
    if (modal) modal.style.display = 'flex';
  }

  // Reiniciar duelo sincronizando a ambos en directo
  window.restartLiveBattleshipGame = function () {
    const isLive = !!(window._liveConnection && window._liveConnection.open);
    if (isLive) {
      sendLiveMsg({ type: 'open_game', game: 'battleship' });
    }
    openBattleshipGame();
  };

  window.openBattleshipGame = openBattleshipGame;
})();
