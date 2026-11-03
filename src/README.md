# Source for the CAV prototype pages

Edit here, then run `python3 build.py` from `cav-home/` to regenerate the root `*.html` files.

- `partials/head.html`, `header.html`, `footer.html`: shared on every page (menu, search, footer, WhatsApp).
- `pages/*.html`: one file per page. First line is a JSON header (title, description, preload image, current menu item), then optional page CSS, the `<main>`, and an optional page script.
- Shared styles live in `../site.css`, shared behaviour in `../site.js`, products in `../catalog.js`.
- `privacy.html` and `cookies.html` are standalone (they use `policy.css`).
