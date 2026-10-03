# Antigravity Agent Guidelines - Cumpleaños Pinchi 2025

## ⚠️ Reglas Críticas del Repositorio
1. **PROHIBIDO EL USO DE `npm`:** Bajo ninguna circunstancia ejecutes comandos `npm` (`npm install`, `npm run`, etc.) ni añadas empaquetadores como Vite o Webpack. Todo el código debe ser Vanilla HTML5, Vanilla CSS3 y JavaScript nativo.
2. **Identidad de los personajes:**
   - **Pinchi:** Representada por un pingüino (🐧).
   - **Chimpi:** Representado por un cerdito (🐷). En juegos como el Tres en Raya, Chimpi juega como el cerdito 🐷.
3. **Arquitectura de Minijuegos:**
   - El orquestador es `msn/minigames.js`.
   - Cada minijuego debe residir en su propio archivo en `msn/games/<nombre>.js`.
   - Si se añade un minijuego, debe registrarse en `MSN_GAMES_CATALOG` (`minigames.js`), cargarse en `index.html` y precachearse en `sw.js`.
4. **Offline & PWA:**
   - La aplicación debe funcionar offline como PWA en Android e iPhone.
   - El archivo de memoria detallado completo es `DOCUMENTACION_PROYECTO.md`.
