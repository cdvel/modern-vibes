# Changelog

## [1.2.0] - 2026-04-11

### Added
- Admin toggle to hide post thumbnails globally (`Design → Customize → Hide post thumbnails`)

### Changed
- Default index view is now cards (grid), localStorage preference no longer overrides on load
- View toggle is hidden (`display: none`) but remains in the DOM
- Background color is now pure white via `--color-background`
- Site title font size increased to `2rem`
- Post card title font size increased to `1.6rem`
- Post tag style: `uppercase`, `letter-spacing: 0.08em`, `font-size: 0.7rem`
- Grid card gap reduced to `var(--space-xs)` (0.5rem)
- Cards now size to content (`align-items: start`) with a minimum height for 3-line titles
- Post images now have `filter: grayscale(100%) contrast(1.1)`
- "You might also like" cards: white background, no border, grayscale filter on thumbnails

### Removed
- Teal underline (`border-bottom`) removed from all headings globally
- Border removed from site avatar image
- "Read more about..." fallback text removed from card excerpts
- "Read more →" link removed from card footers
- Card excerpts hidden via `display: none`
- Empty image placeholder removed from cards and related post cards when no feature image exists
- Invalid `background-image` data URI removed from body styles

## [1.1.0] - Prior release

- Grid/list view toggle
- Subscribe section
- Table of contents on post pages
- "You might also like" related posts section
- Syntax highlighting via highlight.js
