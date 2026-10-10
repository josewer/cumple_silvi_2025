// ==========================================
// MSN GAMES - PUZZLE DESLIZANTE DE RECUERDOS
// ==========================================

(function() {
  // Colección de fotos para elegir al azar en cada partida
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

  // Preferencias persistentes en la sesión (números desactivados por defecto)
  let currentGridSize = 3; // 3 (3x3), 4 (4x4) o 5 (5x5)
  let showNumbers = false;  // Números desactivados por defecto
  let chosenPhoto = null;

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

  function openPuzzleGame(keepPhoto) {
    if (typeof closeGameModal === 'function') closeGameModal();

    // Limpiar cualquier cronómetro previo
    if (window._pzTimerInterval) {
      clearInterval(window._pzTimerInterval);
      window._pzTimerInterval = null;
    }
    // Hook global de limpieza al cerrar el modal de MSN Games
    window._activeGameCleanup = function() {
      if (window._pzTimerInterval) {
        clearInterval(window._pzTimerInterval);
        window._pzTimerInterval = null;
      }
    };

    const modal = window.gameModal || document.getElementById('gameModal');
    const title = window.gameTitle || document.getElementById('gameTitle');
    const content = window.gameContent || document.getElementById('gameContent');

    if (title) title.textContent = '🧩 MSN Games - Puzzle Deslizante de Recuerdos';

    // Elegir foto
    if (!keepPhoto || !chosenPhoto) {
      chosenPhoto = puzzlePhotos[Math.floor(Math.random() * puzzlePhotos.length)];
    }
    const imgSrc = chosenPhoto.src;

    if (content) {
      content.innerHTML = `
        <div style="font-weight:bold;font-size:15px;color:#111;">¡Desliza las piezas para armar la foto! 📸</div>
        <div style="font-size:12px;color:#666;margin-top:2px;">Foto actual: <b>${chosenPhoto.label}</b></div>
        
        <!-- Selectores de tamaño y números -->
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:6px auto;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:bold;color:#444;">Modo:</span>
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

    if (modal) modal.style.display = 'flex';

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

    // Control de tiempo / cronómetro
    const startTime = Date.now();
    let elapsedSeconds = 0;

    function formatTime(totalSecs) {
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updateTimer() {
      if (isSolved) return;
      elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (timerElem) timerElem.textContent = formatTime(elapsedSeconds);
    }

    window._pzTimerInterval = setInterval(updateTimer, 1000);

    // Crear fichas [0, 1, ..., totalTiles - 1]
    let tiles = Array.from({ length: totalTiles }, (_, i) => i);
    let emptyPos = emptyVal;

    // Barajado siempre resoluble por simulación de movimientos legales
    const shuffleSteps = currentGridSize === 3 ? 60 : currentGridSize === 4 ? 120 : 200;
    for (let k = 0; k < shuffleSteps; k++) {
      const neighbors = getNeighbors(emptyPos, currentGridSize);
      const randNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      tiles[emptyPos] = tiles[randNeighbor];
      tiles[randNeighbor] = emptyVal;
      emptyPos = randNeighbor;
    }

    // Asegurar que no quede resuelto por pura casualidad
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
      renderPuzzle(); // Re-render para colocar el trozo final y revelar la foto completa
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
            // Revelar la última pieza para admirar la foto completa
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

          // Indicador de número de pieza para saber el orden (se oculta al resolver para apreciar la foto limpia)
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

    // Conectar botones de configuración
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
        // Re-render sin perder la partida actual
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
