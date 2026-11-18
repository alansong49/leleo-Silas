import os, re, subprocess, sys, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 仓库根目录
DIST = os.path.join(ROOT, "dist")
MDI_CSS = os.path.join(ROOT, "node_modules/@mdi/font/css/materialdesignicons.css")
MDI_FONT = os.path.join(ROOT, "node_modules/@mdi/font/fonts/materialdesignicons-webfont.woff2")
OUT_CSS = os.path.join(ROOT, "src/styles/mdi.css")
OUT_FONT = os.path.join(ROOT, "public/fonts/mdi-subset.woff2")

# 1. collect every mdi-* token that can appear at runtime (src + built output)
tokens = set()
for base in (os.path.join(ROOT, "src"), os.path.join(ROOT, "index.html"), DIST):
    if os.path.isfile(base):
        files = [base]
    else:
        files = [os.path.join(r, f) for r, _, fs in os.walk(base) for f in fs
                 if f.endswith((".js", ".vue", ".html"))]
    for p in files:
        with open(p, encoding="utf-8", errors="ignore") as fh:
            tokens |= set(re.findall(r"mdi-[a-z0-9-]+", fh.read()))

# 2. codepoint map from the official stylesheet
css = open(MDI_CSS, encoding="utf-8").read()
cmap = dict((n, c) for n, c in re.findall(r"\.mdi-([a-z0-9-]+)::before\s*\{\s*content:\s*\"\\([0-9A-Fa-f]+)\"", css))
tokens = {t for t in tokens if t[4:] in cmap}
missing = sorted(t for t in set(re.findall(r"mdi-[a-z0-9-]+", open(os.path.join(ROOT, "src/config.js"), encoding="utf-8").read())) if t[4:] not in cmap)

codepoints = sorted({int(cmap[t[4:]], 16) for t in tokens})
print(f"icons used: {len(tokens)}  codepoints: {len(codepoints)}  unknown: {missing}")

# 3. subset the webfont (woff2 -> woff2)
ufile = os.path.join(os.path.dirname(OUT_FONT), "_unicodes.txt")
with open(ufile, "w") as fh:
    fh.write(",".join(f"U+{cp:04X}" for cp in codepoints))
r = subprocess.run([sys.executable, "-m", "fontTools.subset", MDI_FONT,
                "--unicodes-file=" + ufile, "--flavor=woff2", "--no-hinting",
                "--desubroutinize", "--output-file=" + OUT_FONT],
                capture_output=True, text=True)
print(r.returncode, r.stderr[-500:])
os.remove(ufile)

# 4. generate the matching stylesheet
base_rules = """
.mdi:before,
.mdi-set {
  display: inline-block;
  font: normal normal normal 24px/1 "Material Design Icons";
  font-size: inherit;
  text-rendering: auto;
  line-height: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
"""
parts = ["""/* 仅包含站点实际用到的图标（由 scripts 生成），体积从 403KB 降到几十 KB */
@font-face {
  font-family: "Material Design Icons";
  src: url("/fonts/mdi-subset.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
""", base_rules]
for t in sorted(tokens):
    parts.append(f'.{t}::before {{ content: "\\{cmap[t[4:]]}"; }}\n')
open(OUT_CSS, "w", encoding="utf-8").write("".join(parts))
print("css bytes:", os.path.getsize(OUT_CSS), " font bytes:", os.path.getsize(OUT_FONT))
