# Stay Alive — Public Servers

This is a real WebSocket multiplayer implementation for the Blue Bon pizzeria browser game. It includes a public server browser, room creation, up to eight players per room, shared server-authoritative movement and Bon AI, locker hiding, spectating, a synchronized 90-second night, and a first-person game view. It is not deployed automatically.

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this folder and run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000` in your browser.
5. Open the same address in another browser tab/device on your network (use your computer's LAN IP for other devices) and join the same server.

## Public internet hosting

Deploy this folder to a Node.js hosting provider that supports persistent WebSocket connections (for example Render or Railway), configure its start command as `npm start`, and use the public HTTPS URL. The browser automatically uses secure `wss://` on HTTPS. A static HTML host alone will not run this server. Free hosting may sleep and disconnect active games. Rooms are stored in memory and reset whenever the server restarts.

## Controls

WASD move, mouse look (click canvas to lock, Esc to release), Shift sprint, Ctrl crouch, E hide at blue lockers, F flashlight, M map, G immersive fullscreen. Public server mode has independent players on their own devices; no Tab switching.

## Limitations

This is a prototype with a single Node.js process and in-memory rooms. It does not include accounts, chat, matchmaking across multiple instances, moderation, persistence, or anti-cheat beyond server-authoritative movement. The animatronic is rendered as a rounded 2D character in the first-person raycast scene, not a rigged polygonal 3D mesh. Public deployment requires your hosting account and is not performed here.

## Camera controls

Move the camera by clicking and dragging inside the game canvas (mouse or touch). The pointer stays visible and is never locked. Releasing stops rotation. Esc exits immersive mode.
