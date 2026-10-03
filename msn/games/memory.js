// ==========================================
// MSN GAMES - RETO DE MEMORIA
// ==========================================

function openMemoryGame() {
  closeGameModal();

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '🧠 MSN Games - Reto de Memoria: Nostalgia';

  // Gran catálogo de fotos de pareja y recuerdos para elegir al azar en cada partida
  const allAvailableItems = [
    { id: 'simba', img: './resources/simba.webp', name: 'Simba' },
    { id: 'manolo', img: './resources/manolo.jpg', name: 'Manolo y Benito' },
    { id: 'serrano', img: './resources/serrano.jpeg', name: 'Los Serrano' },
    { id: 'oompa', img: './resources/Oompa_Loompa.webp', name: 'Oompa Loompa' },
    { id: 'chispitas', img: './resources/chispitas.webp', name: 'Chispitas' },
    { id: 'chimpi1', img: './resources/chimpi_1.png', name: 'Chimpi Pequeño' },
    { id: 'pinchi1', img: './resources/pinchi_1.png', name: 'Pinchi Pequeña' },
    { id: 'chimpi2', img: './resources/chimpi_2.jpg', name: 'Chimpi Viajero' },
    { id: 'pinchi2', img: './resources/pinchi_2.jpg', name: 'Pinchi Viajera' },
    { id: 'chimpi3', img: './resources/chimpi_3.png', name: 'Chimpi Guapo' },
    { id: 'pinchi3', img: './resources/pinchi_3.jpg', name: 'Pinchi Guapa' },
    { id: 'chimpi_real', img: './resources/chimpi.jpg', name: 'Chimpi' },
    { id: 'pinchi_real', img: './resources/pinchi.jpg', name: 'Pinchi' },
    { id: 'principe', img: './resources/principe_bel.jpg', name: 'Príncipe Bel-Air' },
    { id: 'dani', img: './resources/dani_martinez.jpg', name: 'Dani Martínez' },
    { id: 'pereza', img: './resources/pereza.jpg', name: 'Pereza' },
    { id: 'spice', img: './resources/spice-girls.jpg', name: 'Spice Girls' }
  ];

  // Elegir 6 items al azar en cada partida
  const shuffledPool = [...allAvailableItems].sort(() => Math.random() - 0.5);
  const selected6 = shuffledPool.slice(0, 6);

  // Crear baraja de 12 cartas mezcladas
  const deck = [...selected6, ...selected6].sort(() => Math.random() - 0.5);

  if (content) {
    content.innerHTML = `
      <div style="font-weight:bold;font-size:15px;color:#111;">Encuentra las 6 parejas de momentazos (¡fotos al azar!)</div>
      <div style="display:flex;gap:15px;align-items:center;justify-content:center;margin:2px 0;">
        <div style="font-size:14px;color:#0078d7;font-weight:bold;">Parejas: <span id="memMatches">0</span>/6</div>
        <button class="msn-game-launch-btn" style="padding:4px 10px;font-size:12px;" onclick="openMemoryGame()">Nuevas Fotos 🔄</button>
      </div>
      <div class="memory-grid" id="memoryGrid"></div>
      <div id="memStatus" style="font-size:13px;color:#555;">Toca dos cartas para descubrir si coinciden 💖</div>
      ${hubBackBtnHtml()}
    `;
  }

  if (modal) modal.style.display = 'flex';

  const grid = document.getElementById('memoryGrid');
  const matchesElem = document.getElementById('memMatches');
  const statusElem = document.getElementById('memStatus');
  let flippedCards = [];
  let matchedCount = 0;
  let lockBoard = false;

  if (grid) {
    deck.forEach((cardData, idx) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.id = cardData.id;
      card.dataset.idx = idx;
      card.innerHTML = '❓';

      card.addEventListener('click', () => {
        if (lockBoard) return;
        if (card.classList.contains('revealed') || card.classList.contains('matched')) return;

        playRetroTone(400, 'sine', 0.08);
        card.classList.add('revealed');
        card.innerHTML = `<img src="${cardData.img}" alt="${cardData.name}">`;
        flippedCards.push(card);

        if (flippedCards.length === 2) {
          lockBoard = true;
          const [card1, card2] = flippedCards;

          if (card1.dataset.id === card2.dataset.id) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedCount++;
            if (matchesElem) matchesElem.textContent = matchedCount;
            playRetroTone(650, 'triangle', 0.15);
            if (navigator.vibrate) try { navigator.vibrate(60); } catch (err) {}
            if (statusElem) statusElem.textContent = `¡Pareja encontrada! 🎉 (${cardData.name})`;
            flippedCards = [];
            lockBoard = false;

            if (matchedCount === 6) {
              if (statusElem) statusElem.innerHTML = '<b style="color:#2e8b57;font-size:16px;">¡RETO SUPERADO! 🎉💖 ¡Memoria prodigiosa!</b>';
              if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 250]); } catch (err) {}
              if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();

              setTimeout(() => {
                if (typeof pruebaActual !== 'undefined' && pruebaActual === 4) {
                  closeGameModal();
                  lastMessagePinchi = "gane";
                  if (typeof prueba_4 === 'function') prueba_4();
                }
              }, 1400);
            }
          } else {
            if (statusElem) statusElem.textContent = 'Casi... ¡sigue buscando! 🧐';
            setTimeout(() => {
              card1.classList.remove('revealed');
              card2.classList.remove('revealed');
              card1.innerHTML = '❓';
              card2.innerHTML = '❓';
              flippedCards = [];
              lockBoard = false;
            }, 900);
          }
        }
      });

      grid.appendChild(card);
    });
  }
}
window.openMemoryGame = openMemoryGame;
