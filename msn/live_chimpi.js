// =============================================================================
// MSN MESSENGER - MODO REAL P2P (PINCHI & CHIMPI EN DIRECTO VIA WEBRTC / PEERJS)
// =============================================================================

(function () {
  // ID fija de la sala para Pinchi
  const PINCHI_PEER_ID = 'pinchi-silvi-cumple-2025-msn';

  // Detectar si estamos en modo Chimpi (a través de URL ?rol=chimpi o localStorage)
  const urlParams = new URLSearchParams(window.location.search);
  const isChimpiMode = urlParams.get('rol') === 'chimpi' || urlParams.get('chimpi') === '1';

  let peer = null;
  let activeConn = null;
  window._liveConnection = null;
  window._isChimpiMode = isChimpiMode;
  window._botSilenced = true; // Por defecto cuando está en vivo, el bot nosti está silenciado

  // Esperar a que PeerJS esté disponible
  function ensurePeerLoaded(callback) {
    if (typeof Peer !== 'undefined') {
      callback();
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof Peer !== 'undefined') {
          clearInterval(interval);
          callback();
        } else if (attempts > 30) {
          clearInterval(interval);
          console.log('PeerJS no disponible (posiblemente offline).');
        }
      }, 250);
    }
  }

  // Crear o actualizar la barra de estado en directo en la parte superior
  function updateLiveUI(status, isConnected) {
    let banner = document.getElementById('liveStatusBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'liveStatusBanner';
      banner.style.cssText = `
        padding: 6px 12px;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        z-index: 9999;
        transition: background 0.3s;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      `;
      const chatWindow = document.querySelector('.chat-window');
      if (chatWindow) {
        chatWindow.insertBefore(banner, chatWindow.firstChild);
      }
    }

    if (isChimpiMode) {
      if (isConnected) {
        banner.style.background = '#28a745';
        banner.style.color = '#ffffff';
        banner.innerHTML = `
          <span>🟢 <b>EN VIVO CON PINCHI:</b> Eres Chimpi (🐷). El bot nosti está silenciado.</span>
          <div style="display:flex;gap:6px;margin-left:auto;flex-wrap:wrap;justify-content:center;">
            <button id="toggleBotBtn" style="background:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:11px;font-weight:bold;cursor:pointer;color:#333;">
              ${window._botSilenced ? '🤖 Bot: 🔇 Silenciado' : '🤖 Bot: 🔊 Activo'}
            </button>
            <button id="launchLiveTTT" style="background:#ffc107;border:none;border-radius:4px;padding:3px 8px;font-size:11px;font-weight:bold;cursor:pointer;color:#111;">
              🎮 Duelo 3 en Raya
            </button>
            <button id="launchLiveMemory" style="background:#00d2d3;border:none;border-radius:4px;padding:3px 8px;font-size:11px;font-weight:bold;cursor:pointer;color:#111;">
              🧠 Duelo Memoria
            </button>
          </div>
        `;

        const botBtn = document.getElementById('toggleBotBtn');
        if (botBtn) {
          botBtn.onclick = () => {
            window._botSilenced = !window._botSilenced;
            if (activeConn && activeConn.open) {
              activeConn.send({ type: 'set_bot', silenced: window._botSilenced });
            }
            updateLiveUI('connected', true);
          };
        }

        const tttBtn = document.getElementById('launchLiveTTT');
        if (tttBtn) {
          tttBtn.onclick = () => {
            if (typeof window.sendLiveGameInvite === 'function') {
              window.sendLiveGameInvite('tictactoe');
            } else if (typeof openTicTacToeGame === 'function') {
              openTicTacToeGame();
            }
          };
        }

        const memBtn = document.getElementById('launchLiveMemory');
        if (memBtn) {
          memBtn.onclick = () => {
            if (typeof window.sendLiveGameInvite === 'function') {
              window.sendLiveGameInvite('memory');
            } else if (typeof openMemoryGame === 'function') {
              openMemoryGame();
            }
          };
        }
      } else {
        banner.style.background = '#ffc107';
        banner.style.color = '#212529';
        banner.innerHTML = `⏳ <b>MODO CHIMPI:</b> Esperando a que Pinchi abra la web en su móvil...`;
      }
    } else {
      // Vista de Pinchi
      if (isConnected) {
        banner.style.display = 'flex';
        banner.style.background = '#e7f5ff';
        banner.style.color = '#0078d7';
        banner.style.borderBottom = '1px solid #70a1ff';
        banner.innerHTML = `✨ <b>¡Conexión Mágica!</b> Chimpi está en directo contigo ahora mismo 🐷💖`;
        const mobileStatus = document.querySelector('.mobile-contact-status');
        if (mobileStatus) {
          mobileStatus.innerHTML = `🟢 <b>En directo contigo ahora mismo</b>`;
        }
      } else {
        banner.style.display = 'none';
      }
    }
  }

  // Inicialización de la red P2P
  function initP2P() {
    ensurePeerLoaded(() => {
      try {
        if (isChimpiMode) {
          setupChimpiMode();
        } else {
          setupPinchiMode();
        }
      } catch (err) {
        console.warn('Nota P2P:', err);
      }
    });
  }

  // --- MODO PINCHI ---
  function setupPinchiMode() {
    peer = new Peer(PINCHI_PEER_ID, {
      debug: 1
    });

    peer.on('open', (id) => {
      console.log('Pinchi lista para recibir a Chimpi.');
    });

    peer.on('connection', (conn) => {
      if (activeConn && activeConn !== conn) {
        try { activeConn.close(); } catch (e) {}
      }
      activeConn = conn;
      window._liveConnection = conn;
      setupConnectionHandlers(conn, 'pinchi');
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        console.log('ID ya en uso en otra pestaña.');
      }
    });
  }

  // --- MODO CHIMPI ---
  function setupChimpiMode() {
    updateLiveUI('waiting', false);
    adaptUIToChimpi();

    peer = new Peer({ debug: 1 });

    peer.on('open', () => {
      connectToPinchi();
    });

    function connectToPinchi() {
      if (activeConn && activeConn.open) return;
      const conn = peer.connect(PINCHI_PEER_ID, {
        reliable: true
      });

      conn.on('open', () => {
        activeConn = conn;
        window._liveConnection = conn;
        setupConnectionHandlers(conn, 'chimpi');
      });

      conn.on('close', () => {
        updateLiveUI('disconnected', false);
        activeConn = null;
        window._liveConnection = null;
        setTimeout(connectToPinchi, 4000);
      });
    }

    setInterval(() => {
      if (!activeConn || !activeConn.open) {
        connectToPinchi();
      }
    }, 4500);
  }

  function adaptUIToChimpi() {
    document.title = 'MSN Messenger - [MODO CHIMPI EN VIVO 🐷]';

    const mobileName = document.querySelector('.mobile-contact-name');
    if (mobileName) {
      mobileName.innerHTML = `Pinchi 🐧 <span class="status-badge">(En línea)</span>`;
    }
    const mobileStatus = document.querySelector('.mobile-contact-status');
    if (mobileStatus) {
      mobileStatus.textContent = `💖 Cumpleañera favorita`;
    }
    const chimpiAvatarHeader = document.querySelector('.mobile-avatar-chimpi');
    if (chimpiAvatarHeader) {
      chimpiAvatarHeader.style.backgroundImage = `url('./resources/pinchi_1.png')`;
    }
    const pinchiAvatarInput = document.querySelector('.mobile-avatar-pinchi');
    if (pinchiAvatarInput) {
      pinchiAvatarInput.style.backgroundImage = `url('./resources/chimpi_1.png')`;
    }
  }

  // Manejo de datos WebRTC
  function setupConnectionHandlers(conn, role) {
    updateLiveUI('connected', true);

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'chat':
          handleIncomingChatMessage(data);
          break;

        case 'buzz':
          handleIncomingBuzz(data);
          break;

        case 'typing':
          handleIncomingTyping(data);
          break;

        case 'video_overlay':
          handleIncomingVideo(data);
          break;

        case 'ttt_move':
          handleIncomingTicTacToeMove(data);
          break;

        case 'memory_init':
          if (typeof window._handleRemoteMemoryInit === 'function') {
            window._handleRemoteMemoryInit(data);
          }
          break;

        case 'memory_flip':
          if (typeof window._handleRemoteMemoryFlip === 'function') {
            window._handleRemoteMemoryFlip(data.index);
          }
          break;

        case 'game_invite':
          handleIncomingGameInvite(data);
          break;

        case 'game_invite_response':
          handleIncomingGameInviteResponse(data);
          break;

        case 'open_game':
          if (data.game === 'tictactoe' && typeof openTicTacToeGame === 'function') {
            openTicTacToeGame();
          } else if (data.game === 'memory' && typeof openMemoryGame === 'function') {
            openMemoryGame(data.deckItemIds, data.startingTurn, true);
          } else if (typeof openGamesHub === 'function') {
            openGamesHub();
          }
          break;

        case 'set_bot':
          window._botSilenced = !!data.silenced;
          break;
      }
    });

    conn.on('close', () => {
      updateLiveUI('closed', false);
      activeConn = null;
      window._liveConnection = null;
    });
  }

  // Retransmitir mensaje a la otra persona cuando el usuario local envía algo
  window.broadcastLiveMessage = function (text, sender) {
    if (!activeConn || !activeConn.open) return;
    activeConn.send({
      type: 'chat',
      text: text,
      sender: sender
    });
    activeConn.send({
      type: 'typing',
      isTyping: false
    });
  };

  function handleIncomingChatMessage(data) {
    if (typeof addMessage === 'function') {
      const sender = data.sender || 'chimpy';
      // Pasamos isRemote = true para que no rebote de vuelta
      addMessage(data.text, sender, null, null, null, true);
    }
    const sound = document.getElementById('soundNotification');
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  let lastBuzzSent = 0;
  window.sendLiveBuzz = function () {
    const now = Date.now();
    if (now - lastBuzzSent < 1500) return;
    lastBuzzSent = now;
    if (activeConn && activeConn.open) {
      activeConn.send({ type: 'buzz', time: now });
    }
  };

  let lastBuzzReceived = 0;
  function handleIncomingBuzz(data) {
    const now = Date.now();
    if (now - lastBuzzReceived < 1500) return;
    lastBuzzReceived = now;

    if (typeof window.agitarPantalla === 'function') {
      window.agitarPantalla();
    }
    const container = document.createElement('div');
    container.className = 'message-container aviso';
    const msg = document.createElement('div');
    msg.className = 'message aviso';
    msg.textContent = '¡Has recibido un zumbido! 🔊';
    container.appendChild(msg);
    const chat = document.getElementById('chat');
    if (chat) {
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;
    }
  }

  function handleIncomingTyping(data) {
    if (typeof showTyping === 'function' && typeof hideTyping === 'function') {
      if (data.isTyping) {
        showTyping();
      } else {
        hideTyping();
      }
    }
  }

  function handleIncomingVideo(data) {
    if (typeof addVideo === 'function' && data.src) {
      addVideo(data.src, data.duration || 10);
    }
  }

  function handleIncomingTicTacToeMove(data) {
    if (typeof window._handleRemoteTicTacToe === 'function') {
      window._handleRemoteTicTacToe(data.index);
    }
  }

  // Funciones para sincronizar el Reto de Memoria en vivo
  window.sendLiveMemoryInit = function (deckItemIds, startingTurn) {
    if (!activeConn || !activeConn.open) return;
    activeConn.send({
      type: 'memory_init',
      deckItemIds: deckItemIds,
      startingTurn: startingTurn || '🐧'
    });
    activeConn.send({
      type: 'open_game',
      game: 'memory',
      deckItemIds: deckItemIds,
      startingTurn: startingTurn || '🐧'
    });
  };

  window.sendLiveMemoryFlip = function (cardIndex) {
    if (!activeConn || !activeConn.open) return;
    activeConn.send({
      type: 'memory_flip',
      index: cardIndex
    });
  };

  // ---------------------------------------------------------------------------
  // SISTEMA DE INVITACIONES A JUEGOS EN MODO LIVE (ESTILO MSN MESSENGER RETRO)
  // ---------------------------------------------------------------------------
  window.sendLiveGameInvite = function (gameId) {
    if (!activeConn || !activeConn.open) {
      if (gameId === 'tictactoe' && typeof openTicTacToeGame === 'function') openTicTacToeGame();
      else if (gameId === 'memory' && typeof openMemoryGame === 'function') openMemoryGame();
      return;
    }

    const gameMap = {
      tictactoe: { title: 'Tres en Raya MSN', icon: '❌⭕' },
      memory: { title: 'Reto de Memoria', icon: '🧠' }
    };
    const g = gameMap[gameId] || { title: 'Juego MSN', icon: '🎮' };
    const inviteId = 'inv_' + Date.now();
    const myName = isChimpiMode ? 'Chimpi' : 'Pinchi';
    const mySymbol = isChimpiMode ? '🐷' : '🐧';
    const opponentName = isChimpiMode ? 'Pinchi' : 'Chimpi';

    // 1. Enviar paquete WebRTC a la otra persona
    activeConn.send({
      type: 'game_invite',
      inviteId: inviteId,
      gameId: gameId,
      gameTitle: g.title,
      gameIcon: g.icon,
      from: myName,
      fromSymbol: mySymbol
    });

    // 2. Notificar en el chat del remitente
    const chat = document.getElementById('chat');
    if (chat) {
      const container = document.createElement('div');
      container.className = 'message-container aviso';
      container.innerHTML = `
        <div class="message aviso" id="invite-box-${inviteId}" style="max-width:92%;">
          📨 Has enviado una invitación a <b>${opponentName}</b> para jugar a <b>${g.icon} ${g.title}</b>.<br>
          <span style="font-size:11px;color:#777;font-style:italic;">Esperando respuesta de ${opponentName}... ⏳</span>
        </div>
      `;
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;
    }

    if (typeof playRetroTone === 'function') playRetroTone(400, 'sine', 0.1);
  };

  function handleIncomingGameInvite(data) {
    const chat = document.getElementById('chat');
    if (!chat) return;

    // Sonido clásico de notificación de MSN
    const sound = document.getElementById('soundNotification');
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
    if (navigator.vibrate) try { navigator.vibrate([100, 60, 100]); } catch (e) {}

    const container = document.createElement('div');
    container.className = 'message-container aviso';
    container.innerHTML = `
      <div class="message msn-invite-bubble" id="incoming-invite-${data.inviteId}">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:32px;">${data.gameIcon}</span>
          <div style="text-align:left;">
            <div style="font-weight:bold;font-size:13px;color:#004a9f;">¡Invitación a juego de MSN!</div>
            <div style="font-size:12px;color:#222;margin-top:2px;">
              <b>${data.from} ${data.fromSymbol}</b> te ha invitado a jugar a:
            </div>
            <div style="font-size:14px;font-weight:bold;color:#111;margin-top:2px;">
              ${data.gameIcon} ${data.gameTitle}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:10px;justify-content:flex-end;" id="invite-btns-${data.inviteId}">
          <button type="button" class="msn-invite-btn accept" onclick="window.respondToGameInvite('${data.inviteId}', '${data.gameId}', true)">
            ✅ Aceptar
          </button>
          <button type="button" class="msn-invite-btn decline" onclick="window.respondToGameInvite('${data.inviteId}', '${data.gameId}', false)">
            ❌ Rechazar
          </button>
        </div>
      </div>
    `;
    chat.appendChild(container);
    chat.scrollTop = chat.scrollHeight;
  }

  window.respondToGameInvite = function (inviteId, gameId, accepted) {
    const btnsElem = document.getElementById(`invite-btns-${inviteId}`);
    const myName = isChimpiMode ? 'Chimpi' : 'Pinchi';

    if (btnsElem) {
      if (accepted) {
        btnsElem.innerHTML = `<span style="color:#28a745;font-weight:bold;font-size:12px;">✅ ¡Has aceptado la invitación! Abriendo partida... 🚀</span>`;
      } else {
        btnsElem.innerHTML = `<span style="color:#777;font-style:italic;font-size:12px;">❌ Has rechazado la invitación.</span>`;
      }
    }

    if (activeConn && activeConn.open) {
      activeConn.send({
        type: 'game_invite_response',
        inviteId: inviteId,
        gameId: gameId,
        accepted: accepted,
        from: myName
      });
    }

    if (accepted) {
      if (typeof playRetroTone === 'function') playRetroTone(550, 'triangle', 0.15);
      setTimeout(() => {
        if (gameId === 'tictactoe' && typeof openTicTacToeGame === 'function') {
          openTicTacToeGame();
        } else if (gameId === 'memory' && typeof openMemoryGame === 'function') {
          openMemoryGame();
        }
      }, 400);
    }
  };

  function handleIncomingGameInviteResponse(data) {
    const inviteBox = document.getElementById(`invite-box-${data.inviteId}`);
    if (data.accepted) {
      if (inviteBox) {
        inviteBox.innerHTML = `
          <div style="color:#28a745;font-weight:bold;font-size:13px;">
            🎉 ¡<b>${data.from}</b> ha aceptado tu invitación! ¡A jugar! 🚀
          </div>
        `;
      }
      if (typeof playRetroTone === 'function') playRetroTone(620, 'triangle', 0.2);
      if (navigator.vibrate) try { navigator.vibrate([80, 50, 80]); } catch (e) {}

      setTimeout(() => {
        if (data.gameId === 'tictactoe' && typeof openTicTacToeGame === 'function') {
          openTicTacToeGame();
        } else if (data.gameId === 'memory' && typeof openMemoryGame === 'function') {
          openMemoryGame();
        }
      }, 400);
    } else {
      if (inviteBox) {
        inviteBox.innerHTML = `
          <div style="color:#c0392b;font-style:italic;font-size:12px;">
            🥺 <b>${data.from}</b> no puede jugar en este momento (invitación rechazada).
          </div>
        `;
      }
      if (typeof playRetroTone === 'function') playRetroTone(220, 'sine', 0.15);
    }
  }

  // Interceptar escritura en tiempo real para indicador "Escribiendo..."
  const inputElem = document.getElementById('input');
  if (inputElem) {
    let typingTimeout = null;
    inputElem.addEventListener('input', () => {
      if (!activeConn || !activeConn.open) return;
      activeConn.send({ type: 'typing', isTyping: true });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        if (activeConn && activeConn.open) {
          activeConn.send({ type: 'typing', isTyping: false });
        }
      }, 1400);
    });
  }

  // El botón de Zumbido se gestiona directamente desde zumbido() en index.html llamando a window.sendLiveBuzz()

  // Interceptar botones de vídeos
  const pigBtn = document.getElementById('pig');
  if (pigBtn) {
    pigBtn.addEventListener('click', () => {
      if (activeConn && activeConn.open) {
        activeConn.send({
          type: 'video_overlay',
          src: './resources/msn-pig-dance.mp4',
          duration: 10
        });
      }
    }, true);
  }

  const angryBtn = document.getElementById('angry');
  if (angryBtn) {
    angryBtn.addEventListener('click', () => {
      if (activeConn && activeConn.open) {
        activeConn.send({
          type: 'video_overlay',
          src: './resources/msn-guitarra.mp4',
          duration: 9
        });
      }
    }, true);
  }

  window.sendLiveTicTacToeMove = function (cellIndex) {
    if (activeConn && activeConn.open) {
      activeConn.send({
        type: 'ttt_move',
        index: cellIndex
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initP2P);
  } else {
    initP2P();
  }
})();
