# Assemble the site: src/partials (head, header, footer) + src/pages/*.html -> ./<page>.html
# Run after editing anything in src/:  python3 build.py
import json, re, pathlib

root = pathlib.Path(__file__).parent
part = {p.stem: p.read_text() for p in (root / 'src/partials').glob('*.html')}
# cache-busting: each shared file is linked with a short hash of its contents, so browsers never mix old and new
import hashlib
ver = {f: hashlib.md5((root / f).read_bytes()).hexdigest()[:8] for f in ('site.css', 'site.js', 'catalog.js', 'consent.js', 'consent.css')}
stamp = lambda html: re.sub(r'(href|src)="(site\.css|site\.js|catalog\.js|consent\.js|consent\.css)"', lambda m: f'{m.group(1)}="{m.group(2)}?v={ver[m.group(2)]}"', html)

for src in sorted((root / 'src/pages').glob('*.html')):
    text = src.read_text()
    meta = json.loads(re.match(r'<!--(\{.*?\})-->', text).group(1))
    css = ''.join(re.findall(r'^<style>[\s\S]*?</style>\n', text, re.M))
    main = text[text.index('<!--MAIN-->\n') + 12:text.index('<!--/MAIN-->')]
    js = text[text.index('<!--/MAIN-->') + 13:]

    head = (part['head'].replace('{{TITLE}}', meta['title']).replace('{{DESC}}', meta['desc'])
            .replace('{{PRELOAD}}', f'<link rel="preload" as="image" href="{meta["preload"]}" fetchpriority="high">' if meta.get('preload') else '')
            .replace('{{PAGE_CSS}}', css))
    # mark the current page in both menus; on its own page Home/links close the drawer
    nav = meta.get('nav', '')
    header = part['header']
    if nav:
        header = re.sub(rf'(<li(?: style="--i:\d")?><a href="{re.escape(nav)}")>', r'\1 aria-current="page">', header)
    out = head + header + main + part['footer'] + '<script src="catalog.js"></script>\n<script src="site.js"></script>\n' + js + '</body>\n</html>\n'
    (root / src.name).write_text(stamp(out))
    print('built', src.name, len(out))
