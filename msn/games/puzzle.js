// ==========================================
// MSN GAMES - PUZZLE DESLIZANTE DE RECUERDOS
// ==========================================

function openPuzzleGame() {
  closeGameModal();

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '🧩 MSN Games - Puzzle Deslizante de Recuerdos';

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

  // Elegir foto al azar
  const chosenPhoto = puzzlePhotos[Math.floor(Math.random() * puzzlePhotos.length)];
  const imgSrc = chosenPhoto.src;

  if (content) {
    content.innerHTML = `
      <div style="font-weight:bold;font-size:15px;color:#111;">¡Desliza las piezas para armar la foto! 📸</div>
      <div style="font-size:12px;color:#666;margin-top:2px;">Foto actual: <b>${chosenPhoto.label}</b></div>
      <div style="font-size:13px;color:#0078d7;font-weight:bold;margin-top:4px;">Movimientos: <span id="pzMoves">0</span></div>
      <div class="sliding-puzzle-grid" id="pzGrid"></div>
      <div id="pzStatus" style="font-size:12px;color:#555;">Toca las piezas pegadas al hueco para moverlas</div>
      <div style="display:flex;gap:10px;margin-top:6px;">
        <button class="msn-game-launch-btn" style="padding:6px 14px;font-size:12px;" onclick="openPuzzleGame()">Cambiar Foto / Mezclar 📸🔄</button>
      </div>
      ${hubBackBtnHtml()}
    `;
  }

  if (modal) modal.style.display = 'flex';

  const grid = document.getElementById('pzGrid');
  const movesElem = document.getElementById('pzMoves');
  const statusElem = document.getElementById('pzStatus');

  let moves = 0;
  let tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  let emptyPos = 8;

  function getNeighbors(pos) {
    const row = Math.floor(pos / 3);
    const col = pos % 3;
    const n = [];
    if (row > 0) n.push(pos - 3);
    if (row < 2) n.push(pos + 3);
    if (col > 0) n.push(pos - 1);
    if (col < 2) n.push(pos + 1);
    return n;
  }

  // Barajado siempre resoluble
  for (let k = 0; k < 60; k++) {
    const neighbors = getNeighbors(emptyPos);
    const randNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    tiles[emptyPos] = tiles[randNeighbor];
    tiles[randNeighbor] = 8;
    emptyPos = randNeighbor;
  }

  function renderPuzzle() {
    if (!grid) return;
    grid.innerHTML = '';
    tiles.forEach((val, pos) => {
      const tileElem = document.createElement('div');
      tileElem.className = 'puzzle-tile';

      if (val === 8) {
        tileElem.classList.add('empty-tile');
      } else {
        const origRow = Math.floor(val / 3);
        const origCol = val % 3;
        tileElem.style.backgroundImage = `url('${imgSrc}')`;
        tileElem.style.backgroundPosition = `-${origCol * 85}px -${origRow * 85}px`;
        tileElem.style.backgroundSize = '255px 255px';

        tileElem.addEventListener('click', () => {
          if (getNeighbors(emptyPos).includes(pos)) {
            tiles[emptyPos] = val;
            tiles[pos] = 8;
            emptyPos = pos;
            moves++;
            if (movesElem) movesElem.textContent = moves;
            playRetroTone(420, 'sine', 0.08);
            if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}
            renderPuzzle();
            checkSolved();
          }
        });
      }

      grid.appendChild(tileElem);
    });
  }

  function checkSolved() {
    for (let i = 0; i < 9; i++) {
      if (tiles[i] !== i) return false;
    }
    if (statusElem) statusElem.innerHTML = '<b style="color:#2e8b57;font-size:15px;">¡PUZZLE COMPLETADO! 🎉 ¡Eres una crack!</b>';
    if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (e) {}
    if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
    return true;
  }

  renderPuzzle();
}
window.openPuzzleGame = openPuzzleGame;
