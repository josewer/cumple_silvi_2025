// =============================================================================
// MSN GAMES - PUZZLE DESLIZANTE DE RECUERDOS (MODO LIBRE Y CARRERA MULTIJUGADOR)
// =============================================================================

(function() {
  // Colección de fotos familiares y recuerdos
  const puzzlePhotos = [
    { src: './resources/chimpi_1.png', label: 'Chimpi' },
    { src: './resources/pinchi_1.png', label: 'Pinchi' },
    { src: './resources/chimpi_2.jpg', label: 'Chimpi Viajero' },
    { src: './resources/pinchi_2.jpg', label: 'Pinchi Viajera' },
    { src: './resources/chimpi_3.png', label: 'Chimpi Sonriente' },
    { src: './resources/pinchi_3.jpg', label: 'Pinchi Guapa' },
    { src: './resources/chimpi.jpg', label: 'Chimpi' },
    { src: './resources/pinchi.jpg', label: 'Pinchi' },
    { src: './resources/manolo.jpg', label: 'Manolo y Benito' },
    { src: './resources/serrano.jpeg', label: 'Los Serrano' },
    { src: './resources/simba.webp', label: 'El Rey León' },
    { src: './resources/chispitas.webp', label: 'Chispitas' },
    { src: './resources/principe_bel.jpg', label: 'El Príncipe de Bel-Air' }
  ];

  // Preferencias del modo libre
  let currentGridSize = 3;
  let showNumbers = false;
  let chosenPhoto = null;

  // Estado de la carrera (Modo Carrera 3 Puzzles)
  let activeRaceConfig = null;
  let isRaceMode = false;
  let isLiveRace = false;
  let isRaceCountingDown = false;
  let raceCountdownTimeouts = [];
  let currentRoundIndex = 0; // 0, 1 o 2 (3 rondas)
  let localRoundCleared = [false, false, false];
  let remoteRoundCleared = [false, false, false];
  let remoteRound = 1;
  let remotePlaced = 0;
  let raceStartTime = 0;
  let raceTotalMoves = 0;
  let isRaceFinished = false;
  let raceWinner = null; // 'local' o 'remote'

  function getConnection() {
    return (window.liveChimpi && window.liveChimpi.conn && window.liveChimpi.conn.open)
      ? window.liveChimpi.conn
      : (window._liveConnection && window._liveConnection.open ? window._liveConnection : null);
  }

  function isChimpi() {
    return !!(window._isChimpiMode || (new URLSearchParams(window.location.search).get('rol') === 'chimpi') || (new URLSearchParams(window.location.search).get('chimpi') === '1'));
  }

  function getLocalSymbol() {
    return isChimpi() ? '🐷' : '🐧';
  }

  function getRemoteSymbol() {
    return isChimpi() ? '🐧' : '🐷';
  }

  function getLocalName() {
    return isChimpi() ? 'Chimpi' : 'Pinchi';
  }

  function getRemoteName() {
    return isChimpi() ? 'Pinchi' : 'Chimpi';
  }

  function getNeighbors(pos, size) {
    const row = Math.floor(pos / size);
    const col = pos % size;
    const n = [];
    if (row > 0) n.push(pos - size);
    if (row < size - 1) n.push(pos + size);
    if (col > 0) n.push(pos - 1);
    if (col < size - 1) n.push(pos + 1);
    return n;
  }

  function countCorrectTiles(tilesArr, totalTiles, emptyVal) {
    let count = 0;
    for (let i = 0; i < totalTiles; i++) {
      if (tilesArr[i] === i && i !== emptyVal) count++;
    }
    return count;
  }

  function formatTime(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function clearRaceTimers() {
    if (window._pzTimerInterval) {
      clearInterval(window._pzTimerInterval);
      window._pzTimerInterval = null;
    }
    raceCountdownTimeouts.forEach(t => clearTimeout(t));
    raceCountdownTimeouts = [];
  }

  // Generador determinista de la carrera (soporta 3x3, y preparado para 4x4 y 5x5)
  function generatePuzzleRaceConfig(customGridSize) {
    const gridSize = customGridSize || 3;
    const totalTiles = gridSize * gridSize;
    const emptyVal = totalTiles - 1;
    const chosenIndices = [];
    while (chosenIndices.length < 3) {
      const r = Math.floor(Math.random() * puzzlePhotos.length);
      if (!chosenIndices.includes(r)) chosenIndices.push(r);
    }

    const shuffleSteps = gridSize === 3 ? 60 : gridSize === 4 ? 120 : 200;

    const rounds = chosenIndices.map(photoIdx => {
      let curEmpty = emptyVal;
      const moves = [];
      for (let k = 0; k < shuffleSteps; k++) {
        const neighbors = getNeighbors(curEmpty, gridSize);
        const randN = neighbors[Math.floor(Math.random() * neighbors.length)];
        moves.push(randN);
        curEmpty = randN;
      }
      return {
        photoIndex: photoIdx,
        shuffleMoves: moves
      };
    });

    return {
      gridSize: gridSize,
      rounds: rounds
    };
  }
  window.generatePuzzleRaceConfig = generatePuzzleRaceConfig;

  // Apertura del juego
  function openPuzzleGame(raceConfigOrKeepPhoto, isRemoteLaunch) {
    if (typeof closeGameModal === 'function') closeGameModal();

    clearRaceTimers();

    window._activeGameCleanup = function() {
      clearRaceTimers();
    };

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');

    const conn = getConnection();

    // Determinar si es modo Carrera o modo Libre
    if (raceConfigOrKeepPhoto && typeof raceConfigOrKeepPhoto === 'object' && Array.isArray(raceConfigOrKeepPhoto.rounds)) {
      isRaceMode = true;
      activeRaceConfig = raceConfigOrKeepPhoto;
      isLiveRace = !!conn;
    } else if (raceConfigOrKeepPhoto === 'solo_race') {
      isRaceMode = true;
      activeRaceConfig = generatePuzzleRaceConfig(3);
      isLiveRace = false;
    } else {
      isRaceMode = false;
      activeRaceConfig = null;
      isLiveRace = false;
    }

    window._activeLiveGame = (isRaceMode && isLiveRace) ? 'Carrera de Puzzles' : null;

    if (title) {
      title.textContent = isRaceMode
        ? '🧩🏁 MSN Games - Carrera de Puzzles (3 Rondas)'
        : '🧩 MSN Games - Puzzle Deslizante de Recuerdos';
    }

    if (isRaceMode) {
      initRaceSession();
    } else {
      initClassicSession(raceConfigOrKeepPhoto === true);
    }

    if (modal) modal.style.display = 'flex';
  }

  // ===========================================================================
  // MODO CARRERA (3 PUZZLES EN VIVO CON SALIDA SINCRONIZADA DE 3 SEGUNDOS)
  // ===========================================================================
  function initRaceSession() {
    const content = window.gameContent || document.getElementById('gameContent');
    currentRoundIndex = 0;
    localRoundCleared = [false, false, false];
    remoteRoundCleared = [false, false, false];
    remoteRound = 1;
    remotePlaced = 0;
    raceTotalMoves = 0;
    isRaceFinished = false;
    raceWinner = null;
    isRaceCountingDown = true;

    const raceGridSize = activeRaceConfig ? (activeRaceConfig.gridSize || 3) : 3;
    const totalTilesInRound = raceGridSize * raceGridSize;
    const totalPlayablePieces = totalTilesInRound - 1;

    if (!content) return;

    content.innerHTML = `
      <style>
        .pz-race-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          user-select: none;
        }
        .pz-scoreboard {
          display: flex;
          gap: 8px;
          width: 100%;
          margin-bottom: 6px;
        }
        .pz-player-box {
          flex: 1;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.06);
        }
        .pz-player-box.my-box {
          border-color: #0078d7;
          background: #e8f4fd;
        }
        .pz-player-box.rival-box {
          border-color: #e84393;
          background: #fff0f6;
        }
        .pz-player-name {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pz-rounds-dots {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
        }
        .pz-dot {
          width: 22px;
          height: 18px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2e8f0;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }
        .pz-dot.active {
          background: #fef08a;
          color: #854d0e;
          border-color: #eab308;
          animation: pz-pulse-dot 1.2s infinite ease-in-out;
        }
        .pz-dot.done {
          background: #bbf7d0;
          color: #166534;
          border-color: #22c55e;
        }
        @keyframes pz-pulse-dot {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .pz-meter-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 2px;
        }
        .pz-meter-fill {
          height: 100%;
          background: #0078d7;
          width: 0%;
          transition: width 0.2s ease;
        }
        .pz-meter-fill.rival {
          background: #e84393;
        }
        .pz-header-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .pz-grid-relative-wrap {
          position: relative;
          width: fit-content;
          margin: 0 auto;
        }
        .pz-countdown-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.78);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          pointer-events: all;
          backdrop-filter: blur(2px);
          animation: pz-fade-in 0.2s ease;
        }
        .pz-countdown-num {
          font-size: 30px;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 2px 8px rgba(0,0,0,0.85);
          line-height: 1.2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .pz-traffic-dot {
          display: inline-block;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 6px currentColor;
        }
        .pz-countdown-label {
          font-size: 12px;
          font-weight: bold;
          color: #f1f5f9;
          margin-top: 4px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9);
          letter-spacing: 0.5px;
        }
        @keyframes pz-pop {
          0% { transform: scale(0.35); opacity: 0; }
          45% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pz-anim-pop {
          animation: pz-pop 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .pz-preview-modal {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          z-index: 99999;
          align-items: center;
          justify-content: center;
        }
      </style>

      <div class="pz-race-wrap">
        <div class="pz-header-badge" style="background:${isLiveRace ? '#dcfce7;color:#166534;' : '#fef3c7;color:#92400e;'}">
          ${isLiveRace ? '🟢 Carrera P2P en Vivo 🐧 vs 🐷' : '⏱️ Reto Solitario (3 Puzzles)'}
        </div>

        <!-- Marcador Dual de Carrera -->
        <div class="pz-scoreboard">
          <div class="pz-player-box my-box">
            <div class="pz-player-name" style="color:#005a9e;">
              <span>${getLocalSymbol()} ${getLocalName()}</span>
              <span style="font-size:10px;color:#666;">(Tú)</span>
            </div>
            <div class="pz-rounds-dots" id="pzLocalDots">
              <div class="pz-dot active" id="pDot1">1</div>
              <div class="pz-dot" id="pDot2">2</div>
              <div class="pz-dot" id="pDot3">3</div>
            </div>
            <div style="font-size:10px;color:#475569;" id="pzLocalProgressTxt">0 / ${totalPlayablePieces} piezas</div>
            <div class="pz-meter-bar">
              <div class="pz-meter-fill" id="pzLocalBar" style="width:0%;"></div>
            </div>
          </div>

          <div class="pz-player-box rival-box">
            <div class="pz-player-name" style="color:#b5179e;">
              <span>${getRemoteSymbol()} ${getRemoteName()}</span>
              <span style="font-size:10px;color:#666;">${isLiveRace ? 'En vivo' : 'Rival'}</span>
            </div>
            <div class="pz-rounds-dots" id="pzRemoteDots">
              <div class="pz-dot ${isLiveRace ? 'active' : ''}" id="rDot1">1</div>
              <div class="pz-dot" id="rDot2">2</div>
              <div class="pz-dot" id="rDot3">3</div>
            </div>
            <div style="font-size:10px;color:#475569;" id="pzRemoteProgressTxt">${isLiveRace ? 'Esperando inicio...' : '---'}</div>
            <div class="pz-meter-bar">
              <div class="pz-meter-fill rival" id="pzRemoteBar" style="width:0%;"></div>
            </div>
          </div>
        </div>

        <div style="font-size:12px;color:#333;margin:2px 0 4px;display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 4px;">
          <span>📸 <b><span id="pzCurrentRoundName">Ronda 1 de 3</span></b></span>
          <span style="color:#222;font-weight:bold;">⏱️ <span id="pzRaceTimer" style="font-family:monospace;color:#d9534f;font-size:13px;">00:00</span></span>
        </div>

        <!-- Contenedor del tablero con semáforo / cuenta atrás de salida -->
        <div class="pz-grid-relative-wrap">
          <div class="sliding-puzzle-grid grid-${raceGridSize}" id="pzRaceGrid"></div>

          <!-- Semáforo de salida 3, 2, 1, GO! -->
          <div class="pz-countdown-overlay" id="pzCountdownOverlay">
            <div class="pz-countdown-num pz-anim-pop" id="pzCountdownNum"><span class="pz-traffic-dot" style="background:#ef4444;color:#ef4444;"></span> 3</div>
            <div class="pz-countdown-label" id="pzCountdownLabel">¡Preparados!...</div>
          </div>
        </div>

        <div id="pzRaceStatus" style="font-size:12px;color:#555;min-height:20px;text-align:center;margin:4px 0;">
          ¡Prepárate en la línea de salida! 🏁
        </div>

        <div style="display:flex;gap:8px;margin-top:6px;justify-content:center;flex-wrap:wrap;">
          <button class="pz-mode-btn" id="btnPzPreview">👁️ Ver foto completa</button>
          <button class="pz-mode-btn ${showNumbers ? 'active' : ''}" id="btnPzRaceNum">🔢 Números: ${showNumbers ? 'SÍ' : 'NO'}</button>
          <button class="pz-mode-btn" id="btnPzExitRace">🔙 Salir de la Carrera</button>
        </div>

        ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
      </div>

      <!-- Modal de previsualización de la foto completa -->
      <div class="pz-preview-modal" id="pzPreviewModal" onclick="this.style.display='none'">
        <div style="background:#fff;padding:8px;border-radius:8px;text-align:center;max-width:280px;box-shadow:0 6px 18px rgba(0,0,0,0.5);" onclick="event.stopPropagation()">
          <div style="font-weight:bold;font-size:13px;color:#333;margin-bottom:6px;" id="pzPreviewTitle">Foto completa</div>
          <img id="pzPreviewImg" src="" style="width:240px;height:240px;object-fit:cover;border-radius:6px;border:2px solid #0078d7;display:block;margin:0 auto;" />
          <button class="msn-game-launch-btn" style="margin-top:8px;padding:4px 14px;font-size:11px;" onclick="document.getElementById('pzPreviewModal').style.display='none'">Cerrar ✖</button>
        </div>
      </div>
    `;

    // Conectar eventos auxiliares
    const btnPreview = document.getElementById('btnPzPreview');
    const previewModal = document.getElementById('pzPreviewModal');
    const previewImg = document.getElementById('pzPreviewImg');
    const previewTitle = document.getElementById('pzPreviewTitle');
    const btnNum = document.getElementById('btnPzRaceNum');
    const btnExit = document.getElementById('btnPzExitRace');

    if (btnPreview && previewModal && previewImg) {
      btnPreview.onclick = () => {
        const roundData = activeRaceConfig.rounds[currentRoundIndex];
        const pObj = puzzlePhotos[roundData.photoIndex] || puzzlePhotos[0];
        previewImg.src = pObj.src;
        if (previewTitle) previewTitle.textContent = `Foto: ${pObj.label}`;
        previewModal.style.display = 'flex';
      };
    }

    if (btnNum) {
      btnNum.onclick = () => {
        showNumbers = !showNumbers;
        btnNum.className = `pz-mode-btn ${showNumbers ? 'active' : ''}`;
        btnNum.textContent = `🔢 Números: ${showNumbers ? 'SÍ' : 'NO'}`;
        renderCurrentRaceRound();
      };
    }

    if (btnExit) {
      btnExit.onclick = () => {
        clearRaceTimers();
        openPuzzleGame(false);
      };
    }

    // Cargar la primera ronda visualmente (bloqueada durante la cuenta atrás)
    loadRaceRound(0);

    // Iniciar secuencia de salida de 3 segundos
    startCountdownSequence();
  }

  // Cuenta atrás de salida de 3 segundos con semáforo y bandera
  function startCountdownSequence() {
    isRaceCountingDown = true;
    const overlay = document.getElementById('pzCountdownOverlay');
    const numElem = document.getElementById('pzCountdownNum');
    const labelElem = document.getElementById('pzCountdownLabel');
    const statusElem = document.getElementById('pzRaceStatus');

    if (!overlay || !numElem || !labelElem) {
      isRaceCountingDown = false;
      raceStartTime = Date.now();
      window._pzTimerInterval = setInterval(updateRaceTimer, 1000);
      return;
    }

    // Paso 1: 🔴 3...
    numElem.innerHTML = '<span class="pz-traffic-dot" style="background:#ef4444;color:#ef4444;"></span> 3';
    labelElem.textContent = '¡Preparados!';
    numElem.className = 'pz-countdown-num pz-anim-pop';
    if (typeof playRetroTone === 'function') playRetroTone(440, 'sine', 0.12);

    // Paso 2: 🟡 2... (a los 1000ms)
    const t1 = setTimeout(() => {
      if (!isRaceMode) return;
      numElem.className = 'pz-countdown-num';
      void numElem.offsetWidth; // Trigger reflow para reiniciar animación
      numElem.innerHTML = '<span class="pz-traffic-dot" style="background:#eab308;color:#eab308;"></span> 2';
      labelElem.textContent = '¡Listos!...';
      numElem.className = 'pz-countdown-num pz-anim-pop';
      if (typeof playRetroTone === 'function') playRetroTone(440, 'sine', 0.12);
    }, 1000);
    raceCountdownTimeouts.push(t1);

    // Paso 3: 🟢 1... (a los 2000ms)
    const t2 = setTimeout(() => {
      if (!isRaceMode) return;
      numElem.className = 'pz-countdown-num';
      void numElem.offsetWidth;
      numElem.innerHTML = '<span class="pz-traffic-dot" style="background:#22c55e;color:#22c55e;"></span> 1';
      labelElem.textContent = '¡Atentos!...';
      numElem.className = 'pz-countdown-num pz-anim-pop';
      if (typeof playRetroTone === 'function') playRetroTone(550, 'sine', 0.15);
    }, 2000);
    raceCountdownTimeouts.push(t2);

    // Paso 4: GO! (a los 3000ms)
    const t3 = setTimeout(() => {
      if (!isRaceMode) return;
      numElem.className = 'pz-countdown-num';
      void numElem.offsetWidth;
      numElem.innerHTML = '<span style="color:#22c55e;font-size:36px;letter-spacing:1px;">GO!</span>';
      labelElem.textContent = '¡A resolver!';
      numElem.className = 'pz-countdown-num pz-anim-pop';
      if (statusElem) {
        statusElem.textContent = `¡Desliza las fichas para completar la foto antes que ${getRemoteName()}!`;
      }
      if (typeof playRetroTone === 'function') playRetroTone(880, 'sine', 0.28);

      // Desvanecer overlay y habilitar juego oficial
      const t4 = setTimeout(() => {
        if (!isRaceMode) return;
        overlay.style.display = 'none';
        isRaceCountingDown = false;
        raceStartTime = Date.now();
        window._pzTimerInterval = setInterval(updateRaceTimer, 1000);
      }, 500);
      raceCountdownTimeouts.push(t4);
    }, 3000);
    raceCountdownTimeouts.push(t3);
  }

  function updateRaceTimer() {
    if (isRaceFinished || isRaceCountingDown) return;
    const elapsed = Math.floor((Date.now() - raceStartTime) / 1000);
    const timerElem = document.getElementById('pzRaceTimer');
    if (timerElem) timerElem.textContent = formatTime(elapsed);
  }

  // Cargar una ronda específica de la carrera
  let currentRoundTiles = [];
  let currentRoundEmptyPos = 8;
  let currentRoundPhotoObj = null;
  let currentRoundSolved = false;

  function loadRaceRound(roundIdx) {
    currentRoundIndex = roundIdx;
    currentRoundSolved = false;

    const roundData = activeRaceConfig.rounds[roundIdx];
    currentRoundPhotoObj = puzzlePhotos[roundData.photoIndex] || puzzlePhotos[0];

    const roundNameElem = document.getElementById('pzCurrentRoundName');
    if (roundNameElem) {
      roundNameElem.textContent = `Ronda ${roundIdx + 1} de 3 (${currentRoundPhotoObj.label})`;
    }

    const raceGridSize = activeRaceConfig ? (activeRaceConfig.gridSize || 3) : 3;
    const totalTiles = raceGridSize * raceGridSize;
    const emptyVal = totalTiles - 1;

    // Inicializar fichas [0..totalTiles - 1]
    currentRoundTiles = Array.from({ length: totalTiles }, (_, i) => i);
    currentRoundEmptyPos = emptyVal;

    // Aplicar la lista determinista de shuffleMoves
    const movesList = roundData.shuffleMoves || [];
    movesList.forEach(neighborPos => {
      currentRoundTiles[currentRoundEmptyPos] = currentRoundTiles[neighborPos];
      currentRoundTiles[neighborPos] = emptyVal;
      currentRoundEmptyPos = neighborPos;
    });

    // Actualizar marcadores de rondas
    updateRaceBadges();
    renderCurrentRaceRound();
    notifyRaceProgress();
  }

  function updateRaceBadges() {
    for (let r = 0; r < 3; r++) {
      const pDot = document.getElementById(`pDot${r + 1}`);
      if (pDot) {
        if (localRoundCleared[r]) pDot.className = 'pz-dot done';
        else if (r === currentRoundIndex) pDot.className = 'pz-dot active';
        else pDot.className = 'pz-dot';
      }

      const rDot = document.getElementById(`rDot${r + 1}`);
      if (rDot) {
        if (remoteRoundCleared[r]) rDot.className = 'pz-dot done';
        else if (r === remoteRound - 1) rDot.className = 'pz-dot active';
        else rDot.className = 'pz-dot';
      }
    }
  }

  function notifyRaceProgress() {
    const raceGridSize = activeRaceConfig ? (activeRaceConfig.gridSize || 3) : 3;
    const totalTiles = raceGridSize * raceGridSize;
    const emptyVal = totalTiles - 1;
    const totalPlayablePieces = emptyVal;

    const placed = countCorrectTiles(currentRoundTiles, totalTiles, emptyVal);
    const localTxt = document.getElementById('pzLocalProgressTxt');
    const localBar = document.getElementById('pzLocalBar');
    if (localTxt) localTxt.textContent = `${placed} / ${totalPlayablePieces} piezas`;
    if (localBar) localBar.style.width = `${Math.round((placed / totalPlayablePieces) * 100)}%`;

    if (isLiveRace && !isRaceCountingDown) {
      const conn = getConnection();
      if (conn) {
        try {
          conn.send({
            type: 'PZ_PROGRESS',
            round: currentRoundIndex + 1,
            placed: placed,
            total: totalPlayablePieces,
            from: isChimpi() ? 'chimpi' : 'pinchi'
          });
        } catch (e) {}
      }
    }
  }

  function renderCurrentRaceRound() {
    const grid = document.getElementById('pzRaceGrid');
    if (!grid) return;

    const raceGridSize = activeRaceConfig ? (activeRaceConfig.gridSize || 3) : 3;
    const totalTiles = raceGridSize * raceGridSize;
    const emptyVal = totalTiles - 1;

    grid.innerHTML = '';
    grid.className = `sliding-puzzle-grid grid-${raceGridSize}`;
    const imgSrc = currentRoundPhotoObj.src;

    currentRoundTiles.forEach((val, pos) => {
      const tileElem = document.createElement('div');
      tileElem.className = 'puzzle-tile';

      if (val === emptyVal) {
        if (currentRoundSolved) {
          tileElem.style.backgroundImage = `url('${imgSrc}')`;
          tileElem.style.backgroundPosition = '100% 100%';
          tileElem.style.backgroundSize = `${raceGridSize * 100}% ${raceGridSize * 100}%`;
          tileElem.style.border = '2px solid #ffd700';
          tileElem.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
        } else {
          tileElem.classList.add('empty-tile');
        }
      } else {
        const origRow = Math.floor(val / raceGridSize);
        const origCol = val % raceGridSize;
        const posX = (origCol / (raceGridSize - 1)) * 100;
        const posY = (origRow / (raceGridSize - 1)) * 100;

        tileElem.style.backgroundImage = `url('${imgSrc}')`;
        tileElem.style.backgroundPosition = `${posX}% ${posY}%`;
        tileElem.style.backgroundSize = `${raceGridSize * 100}% ${raceGridSize * 100}%`;

        if (showNumbers && !currentRoundSolved) {
          const numBadge = document.createElement('span');
          numBadge.className = 'puzzle-tile-num';
          numBadge.textContent = val + 1;
          tileElem.appendChild(numBadge);
        }

        if (!currentRoundSolved && !isRaceFinished) {
          tileElem.addEventListener('click', () => {
            // Durante la cuenta atrás de salida, el tablero permanece bloqueado
            if (isRaceCountingDown || currentRoundSolved || isRaceFinished) return;

            if (getNeighbors(currentRoundEmptyPos, raceGridSize).includes(pos)) {
              currentRoundTiles[currentRoundEmptyPos] = val;
              currentRoundTiles[pos] = emptyVal;
              currentRoundEmptyPos = pos;
              raceTotalMoves++;

              if (typeof playRetroTone === 'function') playRetroTone(440, 'sine', 0.07);
              if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}

              renderCurrentRaceRound();
              notifyRaceProgress();
              checkRaceRoundVictory();
            }
          });
        }
      }

      grid.appendChild(tileElem);
    });
  }

  function checkRaceRoundVictory() {
    const raceGridSize = activeRaceConfig ? (activeRaceConfig.gridSize || 3) : 3;
    const totalTiles = raceGridSize * raceGridSize;

    for (let i = 0; i < totalTiles; i++) {
      if (currentRoundTiles[i] !== i) return false;
    }

    currentRoundSolved = true;
    localRoundCleared[currentRoundIndex] = true;
    updateRaceBadges();
    renderCurrentRaceRound();

    if (currentRoundIndex < 2) {
      // Ronda 1 o 2 completada -> Pasar a la siguiente
      if (typeof playRetroTone === 'function') {
        playRetroTone(523, 'triangle', 0.1);
        setTimeout(() => playRetroTone(659, 'triangle', 0.15), 100);
      }
      if (navigator.vibrate) try { navigator.vibrate([80, 40, 80]); } catch (e) {}

      const status = document.getElementById('pzRaceStatus');
      if (status) {
        status.innerHTML = `<b style="color:#16a34a;font-size:13px;">✨ ¡Ronda ${currentRoundIndex + 1} superada! Cargando siguiente... 🏁</b>`;
      }

      if (isLiveRace) {
        const conn = getConnection();
        if (conn) {
          try {
            conn.send({
              type: 'PZ_ROUND_CLEAR',
              roundCompleted: currentRoundIndex + 1,
              from: isChimpi() ? 'chimpi' : 'pinchi'
            });
          } catch (e) {}
        }
      }

      setTimeout(() => {
        if (!isRaceFinished) {
          loadRaceRound(currentRoundIndex + 1);
        }
      }, 750);
    } else {
      // ¡Ronda 3 completada -> VICTORIA FINAL DE LA CARRERA!
      isRaceFinished = true;
      raceWinner = 'local';
      clearRaceTimers();

      const totalElapsed = Math.floor((Date.now() - raceStartTime) / 1000);
      const timeStr = formatTime(totalElapsed);

      if (isLiveRace) {
        const conn = getConnection();
        if (conn) {
          try {
            conn.send({
              type: 'PZ_MATCH_WON',
              winner: isChimpi() ? 'chimpi' : 'pinchi',
              totalTime: totalElapsed,
              totalMoves: raceTotalMoves,
              from: isChimpi() ? 'chimpi' : 'pinchi'
            });
          } catch (e) {}
        }
      }

      showRaceFinishScreen(true, timeStr, raceTotalMoves);
    }
    return true;
  }

  function showRaceFinishScreen(didIWin, timeStr, totalMoves) {
    const status = document.getElementById('pzRaceStatus');
    const myName = getLocalName();
    const mySymbol = getLocalSymbol();
    const rivalName = getRemoteName();
    const rivalSymbol = getRemoteSymbol();

    if (didIWin) {
      if (status) {
        status.innerHTML = `
          <div style="background:#fef3c7;border:2px solid #eab308;border-radius:8px;padding:8px 12px;margin:8px auto;text-align:center;box-shadow:0 4px 10px rgba(0,0,0,0.15);">
            <div style="font-size:24px;margin-bottom:2px;">🏆👑</div>
            <div style="font-size:14px;font-weight:bold;color:#b45309;">¡VICTORIA! ¡CAMPEÓN DE LA CARRERA!</div>
            <div style="font-size:12px;color:#333;margin-top:2px;">
              <b>${myName} ${mySymbol}</b> completó los 3 puzzles en <b>${timeStr}</b> (${totalMoves} movimientos).
            </div>
            <div style="margin-top:8px;">
              <button class="msn-game-launch-btn" style="padding:6px 16px;font-size:12px;background:#22c55e;" id="btnPzRematch">
                🔄 Jugar Revancha
              </button>
            </div>
          </div>
        `;
      }
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      if (typeof playRetroTone === 'function') {
        playRetroTone(523, 'sine', 0.12);
        setTimeout(() => playRetroTone(659, 'sine', 0.12), 120);
        setTimeout(() => playRetroTone(784, 'sine', 0.15), 240);
        setTimeout(() => playRetroTone(1046, 'sine', 0.35), 380);
      }
    } else {
      if (status) {
        status.innerHTML = `
          <div style="background:#f1f5f9;border:2px solid #cbd5e1;border-radius:8px;padding:8px 12px;margin:8px auto;text-align:center;">
            <div style="font-size:24px;margin-bottom:2px;">🥈🏁</div>
            <div style="font-size:14px;font-weight:bold;color:#1e293b;">¡Carrera Finalizada!</div>
            <div style="font-size:12px;color:#475569;margin-top:2px;">
              <b>${rivalName} ${rivalSymbol}</b> cruzó la meta primero en <b>${timeStr}</b>. ¡Gran duelo!
            </div>
            <div style="margin-top:8px;">
              <button class="msn-game-launch-btn" style="padding:6px 16px;font-size:12px;" id="btnPzRematch">
                🔄 Jugar Revancha
              </button>
            </div>
          </div>
        `;
      }
      if (typeof playRetroTone === 'function') {
        playRetroTone(400, 'sine', 0.15);
        setTimeout(() => playRetroTone(300, 'sine', 0.25), 180);
      }
    }

    const btnRematch = document.getElementById('btnPzRematch');
    if (btnRematch) {
      btnRematch.onclick = () => {
        const currentSize = activeRaceConfig ? (activeRaceConfig.gridSize || 3) : 3;
        const newRaceCfg = generatePuzzleRaceConfig(currentSize);
        if (isLiveRace) {
          const conn = getConnection();
          if (conn) {
            try {
              conn.send({
                type: 'PZ_REMATCH',
                raceConfig: newRaceCfg
              });
            } catch (e) {}
          }
        }
        openPuzzleGame(newRaceCfg, isLiveRace);
      };
    }
  }

  // ===========================================================================
  // MANEJADORES DE EVENTOS REMOTOS P2P
  // ===========================================================================
  window._handleRemotePuzzleProgress = function(data) {
    if (!isRaceMode || isRaceFinished || !data) return;
    remoteRound = data.round || 1;
    remotePlaced = data.placed || 0;
    const totalPlayable = data.total || 8;

    const rTxt = document.getElementById('pzRemoteProgressTxt');
    const rBar = document.getElementById('pzRemoteBar');
    if (rTxt) rTxt.textContent = `Ronda ${remoteRound} (${remotePlaced}/${totalPlayable} piezas)`;
    if (rBar) rBar.style.width = `${Math.round((remotePlaced / totalPlayable) * 100)}%`;

    updateRaceBadges();
  };

  window._handleRemotePuzzleRoundClear = function(data) {
    if (!isRaceMode || isRaceFinished || !data) return;
    const roundCompleted = data.roundCompleted || 1;
    remoteRoundCleared[roundCompleted - 1] = true;
    remoteRound = Math.min(3, roundCompleted + 1);
    remotePlaced = 0;

    updateRaceBadges();

    const status = document.getElementById('pzRaceStatus');
    if (status && !currentRoundSolved) {
      status.innerHTML = `<span style="color:#e84393;font-weight:bold;font-size:11px;">⚡ ¡${getRemoteName()} ${getRemoteSymbol()} ha superado la Ronda ${roundCompleted}! ¡Acelera! 🏃‍♂️</span>`;
    }
    if (typeof playRetroTone === 'function') playRetroTone(340, 'triangle', 0.1);
  };

  window._handleRemotePuzzleMatchWon = function(data) {
    if (!isRaceMode || isRaceFinished) return;
    isRaceFinished = true;
    raceWinner = 'remote';
    clearRaceTimers();
    const rivalTime = formatTime(data.totalTime || 0);
    showRaceFinishScreen(false, rivalTime, data.totalMoves || 0);
  };

  window._handleRemotePuzzleRematch = function(data) {
    if (data && data.raceConfig) {
      openPuzzleGame(data.raceConfig, true);
    }
  };

  // ===========================================================================
  // MODO LIBRE / CLÁSICO (SOLITARIO LIMPIO SIN BOTONES REDUNDANTES)
  // ===========================================================================
  function initClassicSession(keepPhoto) {
    const content = window.gameContent || document.getElementById('gameContent');

    if (!keepPhoto || !chosenPhoto) {
      chosenPhoto = puzzlePhotos[Math.floor(Math.random() * puzzlePhotos.length)];
    }
    const imgSrc = chosenPhoto.src;

    if (content) {
      content.innerHTML = `
        <div style="font-weight:bold;font-size:15px;color:#111;">¡Desliza las piezas para armar la foto! 📸</div>
        <div style="font-size:12px;color:#666;margin-top:2px;">Foto actual: <b>${chosenPhoto.label}</b></div>

        <!-- Selectores de tamaño y números -->
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:8px auto 6px;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:bold;color:#444;">Tamaño:</span>
          <button class="pz-mode-btn ${currentGridSize === 3 ? 'active' : ''}" id="btnPz3">3 × 3 (Fácil)</button>
          <button class="pz-mode-btn ${currentGridSize === 4 ? 'active' : ''}" id="btnPz4">4 × 4 (Normal)</button>
          <button class="pz-mode-btn ${currentGridSize === 5 ? 'active' : ''}" id="btnPz5">5 × 5 (Reto)</button>
          <button class="pz-mode-btn ${showNumbers ? 'active' : ''}" id="btnPzNum" title="Mostrar/ocultar números de orden">🔢 Números: ${showNumbers ? 'SÍ' : 'NO'}</button>
        </div>

        <div style="font-size:13px;color:#0078d7;font-weight:bold;margin-top:2px;display:flex;justify-content:center;align-items:center;gap:16px;">
          <span>Movimientos: <span id="pzMoves">0</span></span>
          <span style="color:#222;">⏱️ Tiempo: <span id="pzTimer" style="font-family:monospace;font-size:14px;color:#d9534f;font-weight:bold;">00:00</span></span>
        </div>
        <div class="sliding-puzzle-grid grid-${currentGridSize}" id="pzGrid"></div>
        <div id="pzStatus" style="font-size:12px;color:#555;min-height:18px;">Toca las piezas pegadas al hueco para moverlas</div>
        
        <div style="display:flex;gap:10px;margin-top:6px;justify-content:center;flex-wrap:wrap;">
          <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:12px;" id="btnPzShuffle">Cambiar Foto / Mezclar 📸🔄</button>
        </div>
        ${typeof hubBackBtnHtml === 'function' ? hubBackBtnHtml() : ''}
      `;
    }

    const grid = document.getElementById('pzGrid');
    const movesElem = document.getElementById('pzMoves');
    const timerElem = document.getElementById('pzTimer');
    const statusElem = document.getElementById('pzStatus');
    const btnPz3 = document.getElementById('btnPz3');
    const btnPz4 = document.getElementById('btnPz4');
    const btnPz5 = document.getElementById('btnPz5');
    const btnPzNum = document.getElementById('btnPzNum');
    const btnPzShuffle = document.getElementById('btnPzShuffle');

    const totalTiles = currentGridSize * currentGridSize;
    const emptyVal = totalTiles - 1;
    let moves = 0;
    let isSolved = false;

    const startTime = Date.now();
    let elapsedSeconds = 0;

    function updateTimer() {
      if (isSolved) return;
      elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (timerElem) timerElem.textContent = formatTime(elapsedSeconds);
    }
    window._pzTimerInterval = setInterval(updateTimer, 1000);

    let tiles = Array.from({ length: totalTiles }, (_, i) => i);
    let emptyPos = emptyVal;

    const shuffleSteps = currentGridSize === 3 ? 60 : currentGridSize === 4 ? 120 : 200;
    for (let k = 0; k < shuffleSteps; k++) {
      const neighbors = getNeighbors(emptyPos, currentGridSize);
      const randNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      tiles[emptyPos] = tiles[randNeighbor];
      tiles[randNeighbor] = emptyVal;
      emptyPos = randNeighbor;
    }

    let allMatches = true;
    for (let i = 0; i < totalTiles; i++) {
      if (tiles[i] !== i) { allMatches = false; break; }
    }
    if (allMatches) {
      const neighbors = getNeighbors(emptyPos, currentGridSize);
      const randNeighbor = neighbors[0];
      tiles[emptyPos] = tiles[randNeighbor];
      tiles[randNeighbor] = emptyVal;
      emptyPos = randNeighbor;
    }

    function checkVictory() {
      for (let i = 0; i < totalTiles; i++) {
        if (tiles[i] !== i) return false;
      }
      isSolved = true;
      if (window._pzTimerInterval) {
        clearInterval(window._pzTimerInterval);
        window._pzTimerInterval = null;
      }
      renderPuzzle();
      const finalTimeStr = formatTime(elapsedSeconds);
      if (statusElem) {
        statusElem.innerHTML = `<b style="color:#2e8b57;font-size:13px;">¡PUZZLE ${currentGridSize}x${currentGridSize} COMPLETADO en ${finalTimeStr} (${moves} movs)! 🎉</b>`;
      }
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
      if (typeof playRetroTone === 'function') {
        playRetroTone(523, 'sine', 0.1);
        setTimeout(() => playRetroTone(659, 'sine', 0.1), 120);
        setTimeout(() => playRetroTone(784, 'sine', 0.25), 240);
      }
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      return true;
    }

    function renderPuzzle() {
      if (!grid) return;
      grid.innerHTML = '';
      grid.className = `sliding-puzzle-grid grid-${currentGridSize}`;

      tiles.forEach((val, pos) => {
        const tileElem = document.createElement('div');
        tileElem.className = 'puzzle-tile';

        if (val === emptyVal) {
          if (isSolved) {
            tileElem.style.backgroundImage = `url('${imgSrc}')`;
            tileElem.style.backgroundPosition = '100% 100%';
            tileElem.style.backgroundSize = `${currentGridSize * 100}% ${currentGridSize * 100}%`;
            tileElem.style.border = '2px solid #ffd700';
            tileElem.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
            tileElem.style.animation = 'pz-final-glow 1.5s ease infinite alternate';
          } else {
            tileElem.classList.add('empty-tile');
          }
        } else {
          const origRow = Math.floor(val / currentGridSize);
          const origCol = val % currentGridSize;
          const posX = (origCol / (currentGridSize - 1)) * 100;
          const posY = (origRow / (currentGridSize - 1)) * 100;

          tileElem.style.backgroundImage = `url('${imgSrc}')`;
          tileElem.style.backgroundPosition = `${posX}% ${posY}%`;
          tileElem.style.backgroundSize = `${currentGridSize * 100}% ${currentGridSize * 100}%`;

          if (showNumbers && !isSolved) {
            const numBadge = document.createElement('span');
            numBadge.className = 'puzzle-tile-num';
            numBadge.textContent = val + 1;
            tileElem.appendChild(numBadge);
          }

          if (!isSolved) {
            tileElem.addEventListener('click', () => {
              if (isSolved) return;
              if (getNeighbors(emptyPos, currentGridSize).includes(pos)) {
                tiles[emptyPos] = val;
                tiles[pos] = emptyVal;
                emptyPos = pos;
                moves++;
                if (movesElem) movesElem.textContent = moves;
                if (typeof playRetroTone === 'function') playRetroTone(420, 'sine', 0.08);
                if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}
                renderPuzzle();
                checkVictory();
              }
            });
          }
        }

        grid.appendChild(tileElem);
      });
    }

    if (btnPz3) {
      btnPz3.addEventListener('click', () => {
        if (currentGridSize !== 3) {
          currentGridSize = 3;
          openPuzzleGame(true);
        }
      });
    }

    if (btnPz4) {
      btnPz4.addEventListener('click', () => {
        if (currentGridSize !== 4) {
          currentGridSize = 4;
          openPuzzleGame(true);
        }
      });
    }

    if (btnPz5) {
      btnPz5.addEventListener('click', () => {
        if (currentGridSize !== 5) {
          currentGridSize = 5;
          openPuzzleGame(true);
        }
      });
    }

    if (btnPzNum) {
      btnPzNum.addEventListener('click', () => {
        showNumbers = !showNumbers;
        btnPzNum.className = `pz-mode-btn ${showNumbers ? 'active' : ''}`;
        btnPzNum.textContent = `🔢 Números: ${showNumbers ? 'SÍ' : 'NO'}`;
        renderPuzzle();
      });
    }

    if (btnPzShuffle) {
      btnPzShuffle.addEventListener('click', () => {
        openPuzzleGame(false);
      });
    }

    renderPuzzle();
  }

  window.openPuzzleGame = openPuzzleGame;
})();
