// =============================================================================
// MSN GAMES - RETO DE MEMORIA (MODO INDIVIDUAL & MODO REAL EN VIVO P2P 🐧 vs 🐷)
// =============================================================================

// Catálogo completo de fotos de pareja y recuerdos
const MEMORY_ALL_ITEMS = [
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

// Generador unificado de baraja de 12 cartas (6 parejas idénticas)
window.generateMemoryDeckIds = function () {
  const shuffledPool = [...MEMORY_ALL_ITEMS].sort(() => Math.random() - 0.5);
  const selected6 = shuffledPool.slice(0, 6);
  const deck12 = [...selected6, ...selected6].sort(() => Math.random() - 0.5);
  return deck12.map(item => item.id);
};

// Reiniciar duelo sincronizando a ambos jugadores en vivo
window.restartLiveMemoryGame = function () {
  const isLive = !!(window._liveConnection && window._liveConnection.open);
  const newDeckIds = window.generateMemoryDeckIds();
  const startingTurn = '🐧';

  if (isLive && typeof window.sendLiveMemoryInit === 'function') {
    window.sendLiveMemoryInit(newDeckIds, startingTurn);
  }
  openMemoryGame(newDeckIds, startingTurn, false);
};

function openMemoryGame(syncDeckIds, startingTurn, isRemoteLaunch) {
  closeGameModal(true);

  var modal = window.gameModal || document.getElementById('gameModal');
  var title = window.gameTitle || document.getElementById('gameTitle');
  var content = window.gameContent || document.getElementById('gameContent');

  if (title) title.textContent = '🧠 MSN Games - Reto de Memoria: Nostalgia';

  const isLive = !!(window._liveConnection && window._liveConnection.open);
  const isChimpi = !!window._isChimpiMode;
  const mySymbol = isChimpi ? '🐷' : '🐧';
  const myName = isChimpi ? 'Chimpi' : 'Pinchi';
  const opponentSymbol = isChimpi ? '🐧' : '🐷';
  const opponentName = isChimpi ? 'Pinchi' : 'Chimpi';

  window._activeLiveGame = isLive ? 'Reto de Memoria' : null;

  let deck = [];
  let currentTurn = startingTurn || '🐧'; // Pinchi siempre comienza de anfitriona

  if (Array.isArray(syncDeckIds) && syncDeckIds.length === 12) {
    // Baraja sincronizada enviada por la otra persona vía WebRTC
    deck = syncDeckIds.map(id => MEMORY_ALL_ITEMS.find(item => item.id === id) || MEMORY_ALL_ITEMS[0]);
  } else {
    // Generar baraja sincronizable de 6 parejas
    const deckIds = window.generateMemoryDeckIds();
    deck = deckIds.map(id => MEMORY_ALL_ITEMS.find(item => item.id === id) || MEMORY_ALL_ITEMS[0]);

    // Si estamos en vivo y la partida se inicia localmente, sincronizar la baraja con la otra persona
    if (isLive && !isRemoteLaunch && typeof window.sendLiveMemoryInit === 'function') {
      window.sendLiveMemoryInit(deckIds, currentTurn);
    }
  }

  // Estado de juego
  let flippedCards = [];
  let matchedCount = 0;
  let lockBoard = false;
  let scores = { '🐧': 0, '🐷': 0 };

  if (content) {
    if (isLive) {
      content.innerHTML = `
        <div style="font-weight:bold;font-size:15px;color:#111;">
          Reto de Memoria: Pinchi (🐧) vs Chimpi (🐷)
          <br><span style="color:#28a745;font-size:12px;">🟢 ¡DUELO EN DIRECTO REAL!</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;justify-content:center;margin:6px 0;font-weight:bold;font-size:14px;">
          <span style="color:#0078d7;padding:3px 8px;border-radius:6px;background:#eef6ff;">🐧 Pinchi: <span id="memScorePinchi">0</span></span>
          <span style="color:#777;">vs</span>
          <span style="color:#e83e8c;padding:3px 8px;border-radius:6px;background:#fff0f6;">🐷 Chimpi: <span id="memScoreChimpi">0</span></span>
        </div>
        <div id="memTurnIndicator" style="font-size:13px;font-weight:bold;padding:5px 10px;border-radius:6px;margin:2px 0 6px 0;transition:all 0.2s;">
          Cargando turno...
        </div>
        <div class="memory-grid" id="memoryGrid"></div>
        <div id="memStatus" style="font-size:12px;color:#666;min-height:20px;">¡A ver quién tiene mejor memoria! 💖</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:6px;">
          <button class="msn-game-launch-btn" style="padding:4px 12px;font-size:12px;" onclick="window.restartLiveMemoryGame()">Reiniciar Duelo 🔄</button>
          ${hubBackBtnHtml()}
        </div>
      `;
    } else {
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
  }

  if (modal) modal.style.display = 'flex';

  const grid = document.getElementById('memoryGrid');
  const matchesElem = document.getElementById('memMatches');
  const scorePinchiElem = document.getElementById('memScorePinchi');
  const scoreChimpiElem = document.getElementById('memScoreChimpi');
  const turnElem = document.getElementById('memTurnIndicator');
  const statusElem = document.getElementById('memStatus');

  function updateTurnUI() {
    if (!isLive || !turnElem) return;
    const isMyTurn = currentTurn === mySymbol;
    if (isMyTurn) {
      turnElem.style.background = '#e6f9ef';
      turnElem.style.color = '#2e8b57';
      turnElem.style.border = '1.5px solid #5fcf91';
      turnElem.innerHTML = `✨ <b>¡Tu turno, ${myName}!</b> (Sigue jugando mientras aciertes 🎯)`;
    } else {
      turnElem.style.background = '#f0f4f8';
      turnElem.style.color = '#555';
      turnElem.style.border = '1px solid #ccc';
      turnElem.innerHTML = `⏳ <b>Turno de ${opponentName} ${opponentSymbol}</b> (Sigue en su turno...)`;
    }
  }

  if (isLive) {
    updateTurnUI();
  }

  // Función que procesa el levantamiento de una carta (tanto local como remota)
  function handleCardFlip(idx, isRemoteMove) {
    if (lockBoard) return;
    const card = grid ? grid.querySelector(`.memory-card[data-idx="${idx}"]`) : null;
    if (!card) return;
    if (card.classList.contains('revealed') || card.classList.contains('matched')) return;

    // En modo en directo, solo se permite tocar cartas si es tu turno o si la orden viene vía WebRTC
    if (isLive && !isRemoteMove) {
      if (currentTurn !== mySymbol) {
        if (statusElem) {
          statusElem.textContent = `¡Es el turno de ${opponentName}! Espera a que termine su jugada 😉`;
        }
        return;
      }
    }

    const cardData = deck[idx];
    if (!cardData) return;

    playRetroTone(400, 'sine', 0.08);
    card.classList.add('revealed');
    card.innerHTML = `<img src="${cardData.img}" alt="${cardData.name}">`;
    flippedCards.push(card);

    // Si fue un movimiento local y estamos en vivo, enviarlo a la otra persona
    if (isLive && !isRemoteMove && typeof window.sendLiveMemoryFlip === 'function') {
      window.sendLiveMemoryFlip(idx);
    }

    if (flippedCards.length === 2) {
      lockBoard = true;
      const [card1, card2] = flippedCards;

      if (card1.dataset.id === card2.dataset.id) {
        // ¡PAREJA ENCONTRADA!
        card1.classList.add('matched');
        card2.classList.add('matched');

        if (isLive) {
          // Asignar el punto al jugador que está jugando el turno actual
          scores[currentTurn]++;
          if (currentTurn === '🐧') {
            card1.style.borderColor = '#0078d7';
            card2.style.borderColor = '#0078d7';
            card1.style.boxShadow = '0 0 10px rgba(0,120,215,0.8)';
            card2.style.boxShadow = '0 0 10px rgba(0,120,215,0.8)';
          } else {
            card1.style.borderColor = '#e83e8c';
            card2.style.borderColor = '#e83e8c';
            card1.style.boxShadow = '0 0 10px rgba(232,62,140,0.8)';
            card2.style.boxShadow = '0 0 10px rgba(232,62,140,0.8)';
          }

          if (scorePinchiElem) scorePinchiElem.textContent = scores['🐧'];
          if (scoreChimpiElem) scoreChimpiElem.textContent = scores['🐷'];

          playRetroTone(650, 'triangle', 0.2);
          if (navigator.vibrate) try { navigator.vibrate(80); } catch (err) {}

          const pointPlayer = currentTurn === '🐧' ? 'Pinchi 🐧' : 'Chimpi 🐷';
          if (statusElem) {
            statusElem.innerHTML = `🎉 ¡Punto para <b>${pointPlayer}</b>! (${cardData.name}) — <b>¡SIGUE SU TURNO! 🎯</b>`;
          }

          matchedCount++;

          // Breve pausa para apreciar la pareja encontrada antes de que el mismo jugador continúe
          setTimeout(() => {
            flippedCards = [];
            lockBoard = false;

            // ¿Se han completado las 6 parejas en vivo?
            if (matchedCount === 6) {
              handleLiveGameEnd();
            } else {
              // CRÍTICO: El jugador que acierta repite turno y NO se cambia
              updateTurnUI();
            }
          }, 500);
        } else {
          // Modo Individual Offline
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
        }
      } else {
        // NO COINCIDEN (FALLO -> CAMBIO DE TURNO TRAS 1.1s)
        playRetroTone(250, 'sine', 0.1);
        if (statusElem) {
          statusElem.textContent = isLive ? `No coinciden... memorizando fotos 🤔` : 'Casi... ¡sigue buscando! 🧐';
        }

        setTimeout(() => {
          card1.classList.remove('revealed');
          card2.classList.remove('revealed');
          card1.innerHTML = '❓';
          card2.innerHTML = '❓';
          flippedCards = [];
          lockBoard = false;

          if (isLive) {
            // El turno cambia ÚNICAMENTE cuando se falla la pareja
            currentTurn = (currentTurn === '🐧') ? '🐷' : '🐧';
            updateTurnUI();
            if (statusElem) {
              const nextPlayer = currentTurn === '🐧' ? 'Pinchi 🐧' : 'Chimpi 🐷';
              statusElem.textContent = `Turno de ${nextPlayer}.`;
            }
          }
        }, 1100);
      }
    }
  }

  function handleLiveGameEnd() {
    window._activeLiveGame = null;
    if (turnElem) turnElem.style.display = 'none';
    const pScore = scores['🐧'];
    const cScore = scores['🐷'];
    const isChimpi = !!window._isChimpiMode;
    const localWon = (isChimpi && cScore > pScore) || (!isChimpi && pScore > cScore);

    if (pScore > cScore) {
      if (statusElem) {
        statusElem.innerHTML = `
          <div style="font-size:16px;color:#2e8b57;font-weight:bold;margin-bottom:4px;">
            ¡HA GANADO PINCHI! 🐧🏆 (${pScore} a ${cScore})
          </div>
          <div style="font-size:13px;color:#0078d7;font-style:italic;">
            Chimpi: ¡Eres invencible mi pingüinito favorito! ¡Qué memoria! 💖
          </div>
        `;
      }
      if (localWon) {
        if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 300]); } catch (e) {}
        if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      } else {
        playRetroTone(220, 'sine', 0.25);
      }
    } else if (cScore > pScore) {
      if (statusElem) {
        statusElem.innerHTML = `
          <div style="font-size:16px;color:#e83e8c;font-weight:bold;margin-bottom:4px;">
            ¡HA GANADO CHIMPI! 🐷🏆 (${cScore} a ${pScore})
          </div>
          <div style="font-size:13px;color:#ff8c00;font-style:italic;">
            Chimpi: ¡Oinss Oinss! El cerdito ha tenido suerte hoy... ¡pero tú tienes mi corazón! 🥰
          </div>
        `;
      }
      if (localWon) {
        if (navigator.vibrate) try { navigator.vibrate([100, 50, 100, 50, 300]); } catch (e) {}
        if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
      } else {
        playRetroTone(220, 'sine', 0.25);
      }
    } else {
      if (statusElem) {
        statusElem.innerHTML = `
          <div style="font-size:16px;color:#0078d7;font-weight:bold;margin-bottom:4px;">
            ¡EMPATE DE PAREJA! 🐧🤝🐷 (3 a 3)
          </div>
          <div style="font-size:13px;color:#555;font-style:italic;">
            ¡Dos mentes gemelas sincronizadas en MSN Messenger!
          </div>
        `;
      }
      if (typeof lanzarConfetiVariasVeces === 'function') lanzarConfetiVariasVeces();
    }
  }

  // Renderizar las 12 cartas
  if (grid) {
    grid.innerHTML = '';
    deck.forEach((cardData, idx) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.id = cardData.id;
      card.dataset.idx = idx;
      card.innerHTML = '❓';

      card.addEventListener('click', () => {
        handleCardFlip(idx, false);
      });

      grid.appendChild(card);
    });
  }

  // Escuchador global para recibir jugadas remotas vía WebRTC
  window._handleRemoteMemoryFlip = function (cardIdx) {
    handleCardFlip(cardIdx, true);
  };
}

window.openMemoryGame = openMemoryGame;

// Manejador cuando la otra persona inicia o reinicia la partida de memoria en vivo
window._handleRemoteMemoryInit = function (data) {
  if (data && Array.isArray(data.deckItemIds)) {
    openMemoryGame(data.deckItemIds, data.startingTurn || '🐧', true);
  }
};
