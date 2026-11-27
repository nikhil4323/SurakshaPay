# SurakshaPay

Local digital payment fraud detection and safety companion for first-time users, seniors, and merchants.

## Run the app

1. Install Node.js 18 or later.
2. Open a terminal in this folder.
3. Run npm start.
4. Open http://127.0.0.1:3000 in your browser.

The Node.js service serves the interface and handles text-message and QR-payload analysis through local API routes. It binds to 127.0.0.1, makes no cloud requests, and does not log or store analyzed text. Screenshot image heuristics continue to run in the browser using the local canvas API.