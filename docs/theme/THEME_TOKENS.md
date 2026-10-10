# Theme Tokens - Vismaya Creative Studios Reference

## Overview
Theme extracted from reference site `https://vismaya-creative-studios.jogi-fileshare.chatgpt.site/`.
Theme style: Editorial Luxury Creative Studio (Warm Alabaster Light Mode, Warm Gold/Bronze Accents, Deep Charcoal Text & Dark Sections, Architectural Serif & Clean Sans Typography, Sharp/Low-Radius Crisp Geometry).

## 1. Color Palette

| Token | CSS Variable / HEX | Usage / Description |
|---|---|---|
| Page Background | `--bg-page: #FAF9F6` | Main page background (warm alabaster off-white) |
| Surface / Card Background | `--bg-surface: #FFFFFF` | Cards, modals, containers, inputs |
| Surface Subdued / Alt | `--bg-surface-alt: #F0EEE7` | Table headers, secondary cards, section backgrounds |
| Dark Surface / Section | `--bg-dark: #292C29` / `#2C332D` | Footer, dark banners, hero highlight blocks, sidebars |
| Primary Accent (Gold/Bronze) | `--color-primary: #9B7A3F` | Primary buttons, active states, active tab highlights |
| Primary Hover | `--color-primary-hover: #866731` | Hover state for gold buttons & links |
| Text Primary (Charcoal) | `--text-primary: #292C29` | Headings, main text |
| Text Secondary / Muted | `--text-muted: #777970` | Subtitles, captions, dates, metadata |
| Text Inverse | `--text-inverse: #FAF9F6` | Text on dark backgrounds |
| Border Standard | `--border-color: #E4E1D9` | Dividers, card borders, input borders |
| Border Muted / Light | `--border-light: #EEEADF` | Light table dividers |
| Border Focus / Accent | `--border-accent: #9B7A3F` | Focused input border |

## 2. Typography

- **Serif Font (Headings & Brand Title)**: `Georgia, "Times New Roman", serif`
  - H1: `64px` (4rem), line-height: `1.1`, weight: `400`
  - H2: `36px` (2.25rem), line-height: `1.2`, weight: `400`
  - H3: `24px` (1.5rem), line-height: `1.3`, weight: `400`
- **Sans-Serif Font (Body & UI)**: `Arial, Helvetica, system-ui, sans-serif`
  - Body Base: `16px` (1rem), line-height: `1.8`, weight: `400`
  - Body Small / Meta: `14px` (0.875rem), line-height: `1.5`, weight: `400`
  - Micro Tag / Badge: `10px - 11px`, weight: `500` / `600`, tracking: `0.1em` uppercase

## 3. Spacing, Radius & Shadows

- **Border Radius**:
  - Small / Input / Button: `4px` (`0.25rem`) or `2px` (`0.125rem`)
  - Card / Modal: `6px` (`0.375rem`) or sharp `0px`
  - Badge / Tag: `4px` or full pill (`9999px`) where appropriate
- **Shadows**:
  - Minimal / Clean: `0 1px 3px rgba(41,44,41,0.05)` or crisp border focus `0 0 0 2px rgba(155,122,63,0.2)`
- **Container Max-Width**: `1280px` (`max-w-7xl`) with responsive padding (`px-4 sm:px-6 lg:px-12`)

## 4. Components Style Specification

- **Primary Button**: Background `#9B7A3F` or `#292C29`, Text `#FAF9F6`, Font Sans-Serif 14px uppercase/tracking-wide or normal, Padding `12px 24px`, Radius `4px`, Hover `#866731` / `#1F221F`.
- **Secondary Button**: Background `transparent` or `#F0EEE7`, Border `1px solid #E4E1D9`, Text `#292C29`, Hover `#E4E1D9`.
- **Cards**: Background `#FFFFFF` or `#FAF9F6`, Border `1px solid #E4E1D9`, Padding `20px` to `24px`, sharp/subtle radius `4px`-`6px`, no glassmorphism / dark neon glows.
- **Navbar**: Background `#FAF9F6` (or translucent `#FAF9F6/95`), bottom border `1px solid #E4E1D9`, Logo in serif typography `#292C29`.
- **Footer**: Background `#292C29` (deep charcoal) or `#FAF9F6` with top border `#E4E1D9`, Text `#FAF9F6` / `#99948A`.
- **Inputs**: Background `#FFFFFF`, Border `1px solid #E4E1D9`, Radius `4px`, Text `#292C29`, Focus Ring `#9B7A3F`.
- **Badges / Status Chips**: Subdued background (`#F0EEE7`), border `1px solid #E4E1D9`, text `#777970` or status-specific soft muted tone (e.g. muted emerald, muted amber, muted rose).
