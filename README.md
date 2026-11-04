# KY-Poni Official Game Themes Repository

Official curated theme catalog for **KY-Poni - Livestream Chat Overlay Studio**.

This repository serves as the remote catalog distribution hub for KY-Poni desktop applications (`.AppImage` & `.exe`). Themes downloaded through the KY-Poni In-App Catalog are fetched directly from GitHub Releases in this repository.

## 🎨 Katalog Tema Resmi (Official Theme Catalog)

| ID | Nama Tema | Gaya Game | Default Font | Default Warna |
| :--- | :--- | :--- | :--- | :--- |
| `undertale` | Undertale Retro Box | 8-Bit Pixel RPG | `VT323` | `#FFFFFF` |
| `cyberpunk2077` | Cyberpunk 2077 Night City HUD | Neon Sci-Fi HUD | `Chakra Petch` | `#FFE600` |

---

## 📦 Theme Structure Standard (`THEME_SPEC.md`)
Setiap tema dikemas dalam arsip `.zip` dengan struktur:
```text
<theme-id>.zip
├── theme.json        # Metadata, presets, and tags
├── style.css         # Styling, layout, and animations
├── renderer.js       # window.KYPoniTheme DOM constructor
└── assets/           # Local fonts, sprites, icons
```
