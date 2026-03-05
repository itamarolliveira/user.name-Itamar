# Snake Classic

Jogo Snake clássico implementado em JavaScript puro, sem dependências externas.

## Como rodar

No PowerShell:

1. `cd C:\Users\Itamar\OneDrive\Imagens\Documentos\snake-classic`
2. `.\tools\node\npm.cmd run dev`
3. Abra: `http://localhost:5173`

## Testes

- `.\tools\node\npm.cmd test`

## Checklist manual

- Movimento por teclado: setas e `W/A/S/D`.
- Controles na tela (Up/Down/Left/Right) funcionam no mobile/desktop.
- Snake cresce ao comer comida.
- Score incrementa corretamente.
- Colisão com parede encerra o jogo.
- Colisão com o corpo encerra o jogo.
- `Pause`/`Resume` com botão e tecla `Space`.
- `Restart` reinicia estado (score zero, snake nova, nova comida).