# 🐧 MSN Messenger Retro - Cumpleaños Pinchi 2025 🐷

Documento de memoria técnica y funcional de todo lo desarrollado, diseñado y estructurado en este proyecto para recordar el contexto, decisiones y arquitectura en cualquier ocasión futura.

---

## 🎯 1. Propósito del Proyecto y Contexto Emocional

- **Destinataria:** "Pinchi" (su avatar y representación es un pingüino 🐧).
- **Autor / Creador:** "Chimpi" (su avatar y representación es un cerdito 🐷).
- **Motivo:** Regalo y sorpresa interactiva de cumpleaños (2025/2026).
- **Temática:** Recreación fiel y nostálgica de **Windows Live Messenger (MSN Messenger de los 2000s)**, ambientada en la época millennial en la que la pareja pasaba horas chateando.
- **Flujo narrativo:**
  1. Pinchi abre el chat y Chimpi le da la bienvenida como "nosti" oficial del concurso de nostalgia millennial.
  2. Superación de pruebas nostálgicas (Desafío musical, "¿Quién lo dijo y quién es?", Guerra de Pingüinos, Reto de memoria con fotos de su relación).
  3. Desbloqueo progresivo de fotos de avatar históricas según avanzan las pruebas.
  4. Premios, vídeos nostálgicos y acceso completo al **Salón de Juegos Retro MSN**.

---

## 🛑 2. Reglas Técnicas y Restricciones Absolutas

1. **PROHIBIDO EL USO DE `npm`:**
   - **Regla estricta del usuario:** No se debe ejecutar `npm install`, `npm run`, ni usar empaquetadores como Vite, Webpack o dependencias externas con node_modules.
   - **Tecnologías usadas:** 100% Vanilla HTML5, Vanilla CSS3 y JavaScript moderno nativo (ES6+ modular).
2. **Compatibilidad Móvil (Android e iOS):**
   - Debe funcionar tanto en navegador de escritorio como en smartphones (diseño vertical responsivo).
   - Implementado como **PWA (Progressive Web App)**: Se puede instalar en la pantalla de inicio desde Chrome (Android) y Safari (iPhone).
   - Sin desfases de audio: Audio sintetizado con **Web Audio API** nativo para no depender de librerías ni descargas externas para los minijuegos.
   - Vibración háptica nativa con `navigator.vibrate` en zumbidos, aciertos y victorias.

---

## 🏛️ 3. Arquitectura del Código y Estructura de Archivos

```text
c:\dev\cumple_pinchi_2025\
├── DOCUMENTACION_PROYECTO.md   <-- Este documento de memoria completa
├── AGENTS.md                   <-- Contexto permanente para asistentes IA
├── pinchios/                   <-- Otra sección/variante del proyecto
└── msn/                        <-- Directorio principal de la aplicación web
    ├── index.html              <-- Interfaz principal MSN, chat, estilos y carga ordenada de scripts
    ├── minigames.js            <-- 🎮 ORQUESTADOR CENTRAL (Modal, Web Audio, Catálogo y Hub)
    ├── manifest.json           <-- Manifiesto PWA para instalación en Android/iPhone
    ├── sw.js                   <-- Service Worker v2 con precache offline de minijuegos
    ├── delfin.fla              <-- Archivo Flash histórico original
    ├── resources/              <-- Audios (zumbido mp3, notificación), avatares, fotos e iconos
    └── games/                  <-- 📂 Módulos individuales de cada uno de los 14 minijuegos
        ├── penguin.js          (1. Guerra de Pingüinos)
        ├── memory.js           (2. Reto de Memoria)
        ├── runner.js           (3. Salto Antártico)
        ├── catcher.js          (4. Lluvia de Regalos)
        ├── scratch.js          (5. Rasca y Gana de Cumpleaños)
        ├── wheel.js            (6. La Ruleta Millennial)
        ├── tictactoe.js        (7. Tres en Raya: Pinchi vs Chimpi)
        ├── puzzle.js           (8. Puzzle Deslizante 3x3)
        ├── simon.js            (9. Simón Dice MSN)
        ├── feedpig.js          (10. Alimenta a Chimpi el Cerdito)
        ├── brick.js            (11. Rompe-Ladrillos Pingüino)
        ├── hangman.js          (12. Ahorcado Romántico - Salva la tarta)
        ├── bubbles.js          (13. Burbujas del Amor)
        └── quiz.js             (14. Test de Pareja Cómico)
```

---

## 🎮 4. Catálogo Detallado de los 14 Minijuegos

Todos los minijuegos son táctiles, tienen sonido retro sintetizado (Web Audio API), soporte de vibración en smartphones y botón para regresar a la sala de juegos:

| # | Archivo | Nombre | Icono | Descripción y Mecánica |
|---|---|---|---|---|
| 1 | `games/penguin.js` | **Guerra de Pingüinos** | 🐧 | Juego estilo *Whack-a-mole* donde los pingüinos asoman de témpanos de hielo y hay que tocarlos a contrarreloj. |
| 2 | `games/memory.js` | **Reto de Memoria** | 🧠 | Encuentra las 6 parejas de momentos nostálgicos y fotos de su historia juntos. |
| 3 | `games/runner.js` | **Salto Antártico** | 🛷 | *Runner* en canvas 2D donde Pinchi salta sobre témpanos y esquiva hielo para atrapar 10 corazones. Tiene 3 vidas. |
| 4 | `games/catcher.js` | **Lluvia de Regalos** | 🎁 | Desliza a Pinchi con su cesta para atrapar regalos y tartas que caen del cielo. |
| 5 | `games/scratch.js` | **Rasca y Gana de Cumple** | ✨ | Tarjeta de rascar táctil en canvas con efecto real de escarcha. Al rascar el 55% revela un mensaje y foto de Chimpi. |
| 6 | `games/wheel.js` | **La Ruleta Millennial** | 🎡 | Ruleta de premios con desaceleración física, sonido de tic-tac y vales de regalo reales (Cena, Peli+Manta, Masaje, Escapada, etc.). |
| 7 | `games/tictactoe.js` | **Tres en Raya MSN** | ❌⭕ | Duelo directo: **Pinchi (🐧)** contra **Chimpi el Cerdito (🐷)**. Incluye IA que intenta ganar o bloquear y frases cómicas de Chimpi (*"Oink!"*). |
| 8 | `games/puzzle.js` | **Puzzle Deslizante** | 🧩 | Cuadrícula 3x3 para ordenar las piezas desordenadas de una foto de recuerdo. |
| 9 | `games/simon.js` | **Simón Dice MSN** | 🎶 | Secuencia de luces y tonos retro generados con Web Audio. Hay que recordar y repetir 5 rondas. |
| 10 | `games/feedpig.js` | **Alimenta a Chimpi** | 🍖 | Chimpi el cerdito se mueve arriba y Pinchi tiene raciones de comida limitadas (14 raciones) para acertar 8 veces antes de que se agote la comida o el tiempo. |
| 11 | `games/brick.js` | **Rompe-Ladrillos MSN** | 🧱 | Arkanoid retro clásico donde una pala de hielo controlada con el dedo rebota bolas de nieve para destruir 18 ladrillos. |
| 12 | `games/hangman.js` | **Ahorcado Romántico** | 🔤 | Adivina frases románticas en un teclado virtual antes de que Chimpi avance 6 pasos y se coma la tarta de cumple. |
| 13 | `games/bubbles.js` | **Burbujas del Amor** | 🫧 | Explota 20 burbujas flotantes tocándolas en pantalla con sonido "pop" antes de que escapen. |
| 14 | `games/quiz.js` | **Test de Pareja Cómico** | 💑 | 5 preguntas divertidas de pareja con respuestas cómicas y veredicto final con confeti de cumpleaños. |

---

## 🔧 5. El Orquestador (`msn/minigames.js`)

Para evitar dependencias cruzadas y duplicidades:
- **`MSN_GAMES_CATALOG`:** Array de objetos que define cada juego (`id`, `title`, `desc`, `icon`, `fn`).
- **`openGamesHub()`:** Genera dinámicamente las tarjetas del menú y conecta los eventos de click.
- **`closeGameModal()`:** Limpia con seguridad cualquier `_gameInterval`, `_spawnTimer` y `_animFrame` para que no se queden procesos en bucle en segundo plano.
- **`playRetroTone(freq, type, duration)`:** Sintetizador con oscilador de audio (`AudioContext`) para sonidos sin requerir archivos mp3 externos.
- **Seguridad en variables:** Se asignan a `window` de forma defensiva para evitar `SyntaxError: Identifier has already been declared`.

---

## 📱 6. Despliegue en GitHub Pages y Uso como App Móvil (PWA Offline)

- **Repositorio Git Remoto:** `https://github.com/josewer/cumple_silvi_2025.git`
- **Rama:** `main`
- **URL pública en GitHub Pages:** `https://josewer.github.io/cumple_silvi_2025/msn/`
- **Redirección Raíz:** `index.html` en la raíz redirige automáticamente a `./msn/`.
- **Configuración de GitHub Pages:**
  - Repositorio -> *Settings* -> *Pages*.
  - Source: *Deploy from a branch*.
  - Branch: `main` / `root`.
- **Instalación y Funcionamiento Offline en iPhone (iOS Safari):**
  - **Ajustes implementados para iOS:**
    - `apple-mobile-web-app-capable: yes` y `apple-mobile-web-app-title: MSN Messenger` para que Safari lo instale como aplicación standalone a pantalla completa en el springboard y no como un marcador web estándar.
    - `apple-touch-icon` en resoluciones 180x180, 152x152 y 120x120.
    - Manifiesto con `id`, `scope: "./"` y `display_override: ["standalone"]`.
    - **Service Worker v5:**
      - Precache integral y tolerante a fallos de todos los recursos (audios mp3 del concurso, vídeos mp4, avatares, fotos nostálgicas, minijuegos y biblioteca PeerJS).
      - Manejo de peticiones de navegación (`mode: 'navigate'`) que devuelve `index.html` de la caché si la red falla o está sin conexión.
      - Soporte para peticiones `Range` (HTTP 206 Partial Content) imprescindible para que Safari iOS reproduzca audios y vídeos en modo offline sin errores.
  - **Cómo instalarlo en iPhone:**
    1. Abrir `https://josewer.github.io/cumple_silvi_2025/msn/` en **Safari**.
    2. Esperar 2-3 segundos a que el Service Worker descargue los recursos en caché.
    3. Tocar el botón de compartir de Safari (cuadrado con flecha hacia arriba `⎋` en la barra inferior).
    4. Seleccionar **"Añadir a la pantalla de inicio"** (Add to Home Screen).
    5. Pulsar **Añadir**. Aparecerá el icono de MSN Messenger como una app nativa que se abre sin marcos ni barras y funciona completamente offline.
- **Instalación en Android:**
  - Abrir el enlace en Google Chrome.
  - Tocar el menú de 3 puntos `⋮` y seleccionar **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"**.

## 💡 7. Consejos y Recordatorios para Futuras Sesiones

1. **Identidad de los personajes:** Pinchi siempre es un pingüino (🐧) y Chimpi siempre es un cerdito (🐷).
2. **No romper el estilo retro:** Mantener fuentes Comic Sans / Arial, colores azul MSN (`#0078d7`), cabecera con estado de Avril Lavigne, avatares flotantes y sonidos clásicos de zumbido.
3. **Mantenimiento de scripts:** Si se crea un juego nuevo:
   - Crear el archivo en `msn/games/<nombre>.js`.
   - Registrarlo en `MSN_GAMES_CATALOG` en `minigames.js`.
   - Añadir la etiqueta `<script src="./games/<nombre>.js"></script>` en `index.html`.
   - Añadirlo a `CORE_ASSETS` en `sw.js` para caché offline.

---

## 📡 8. Modo Real en Vivo (P2P WebRTC - PeerJS)

Implementado en `msn/live_chimpi.js` para permitir que Chimpi se conecte en directo con Pinchi desde otro móvil o PC:
1. **Acceso de Chimpi:**
   - URL: `https://josewer.github.io/cumple_silvi_2025/msn/?rol=chimpi`
   - O pulsando el botón `🐷 Modo Chimpi en Vivo` en el menú de ajustes de la web.
2. **Capacidades en tiempo real:**
   - **Chat bidireccional:** Todo lo que Chimpi teclea y envía le llega a Pinchi al instante como mensaje de Chimpi.
   - **Indicador "Escribiendo...":** Mientras Chimpi escribe, en el móvil de Pinchi aparece el lápiz de MSN en tiempo real.
   - **Zumbido remoto real:** Al pulsar el botón de zumbido, se despacha un único paquete vía WebRTC con debounce de 1.5s y control de conexiones previas; la pantalla de Pinchi tiembla exactamente una vez, reproduce el sonido de zumbido y su teléfono vibra en su mano (sin mensajes duplicados ni respuestas del bot).
   - **Vídeos remotos:** Al pulsar el cerdo bailarín o la guitarra, se le reproduce el vídeo en la pantalla de Pinchi.
   - **Tres en Raya Multijugador Real:** El juego detecta la conexión en vivo y permite que Chimpi juegue como el cerdito 🐷 por turnos contra el pingüino 🐧 de Pinchi en directo, desactivando la IA.
   - **Reto de Memoria Multijugador en Vivo:** Duelo de memoria por turnos sincronizado en tiempo real. Pinchi (🐧) y Chimpi (🐷) juegan sobre un tablero de 12 cartas idéntico sincronizado vía WebRTC; cada uno levanta cartas en su turno y el otro lo ve en directo. Quien acierta una pareja suma punto, repite turno y se ilumina la carta con su color (azul MSN para Pinchi, rosa para Chimpi). Al final, se determina el ganador con frases cómicas, confeti y vibración. Si no hay conexión en vivo, funciona en modo individual clásico.
   - **Sistema de Invitaciones a Juegos MSN (Estilo Retro):** Tanto desde el banner de Chimpi como desde la Sala de Juegos MSN, se puede enviar una invitación por chat para jugar juntos (Tres en Raya, Reto de Memoria o Hundir la Flota). Al invitado le suena la notificación clásica de MSN, vibra el móvil y le aparece en el chat la tarjeta retro compacta con botones interactivos `[✅ Aceptar]` y `[❌ Rechazar]`. Si acepta, se abre la partida sincronizada en ambos teléfonos simultáneamente; si rechaza, se notifica amigablemente al remitente.
   - **Hundir la Flota (Batalla Naval 6x6 en Vivo y Solitario):** Minijuego clásico naval retro. Cada jugador posiciona sus 4 barcos (Acorazado de 3 casillas, Fragata de 2, Lancha de 2 y Submarino de 1) pudiendo barajar su flota aleatoriamente con 🎲. Al zarpar ambos jugadores, se activa el Radar de Ataque y la cuadrícula defensiva. Por turnos, se disparan torpedos vía WebRTC (o contra la IA porcina de Chimpi en solitario). Cuenta con sonidos navales sintetizados (sonar ping, chapoteo de agua, explosión de tocado y fanfarria de barco hundido). El ganador recibe confeti y fanfarria de victoria; en caso de derrota, no hay confeti. Si cualquiera de los dos abandona la partida cerrando la ventana, se avisa en el chat y se cierra el juego en ambos dispositivos.
