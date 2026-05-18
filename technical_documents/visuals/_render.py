"""
Extract every mermaid block from role_workflows.md and render each to a PNG
in this folder via mermaid.ink (the official hosted renderer; no local
Chromium install needed).

Usage:
    python _render.py
"""
import base64
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# Force UTF-8 stdio on Windows so emoji in mermaid sources never crash print()
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = Path(__file__).parent
SRC = HERE.parent / "role_workflows.md"
MERMAID_INK = "https://mermaid.ink/img/{b64}?type=png&bgColor=FFFFFF"
UA = "Mozilla/5.0 (compatible; smart-sales-doc-renderer/1.0)"

def sanitize_mermaid(src: str) -> str:
    """Make the source mermaid.ink-safe.

    - Strip `\\(` / `\\)` escapes the markdown uses to keep parens out of editor link parsing.
    - Convert literal `\\n` to `<br/>` so unquoted labels get real line breaks
      in the rendered SVG/PNG (mermaid only treats `\\n` as a break inside
      quoted labels).
    """
    return (
        src.replace(r"\(", "(")
           .replace(r"\)", ")")
           .replace(r"\n", "<br/>")
    )

# Map (section_number, sub_number) → file slug; fallback uses heading text.
MERMAID_BLOCK_RE = re.compile(r"```mermaid\n(.*?)\n```", re.DOTALL)

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")

def render(source: str, dest: Path, attempt: int = 1) -> bool:
    # mermaid.ink: GET https://mermaid.ink/img/<base64> — base64 is the
    # URL-safe encoding of the raw mermaid source (no padding stripping needed).
    safe_src = sanitize_mermaid(source)
    b64 = base64.urlsafe_b64encode(safe_src.encode("utf-8")).decode("ascii")
    url = MERMAID_INK.format(b64=b64)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            dest.write_bytes(r.read())
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"  ! HTTP {e.code} for {dest.name}: {body}", flush=True)
    except Exception as e:
        print(f"  ! attempt {attempt} {dest.name}: {e}", flush=True)
    if attempt < 3:
        time.sleep(1.5 * attempt)
        return render(source, dest, attempt + 1)
    return False

def main() -> int:
    if not SRC.exists():
        print(f"Source not found: {SRC}", file=sys.stderr)
        return 1

    text = SRC.read_text(encoding="utf-8")

    # Walk the file line-by-line so we can pair each ```mermaid block with the
    # nearest preceding heading (## or ###).
    lines = text.splitlines()
    diagrams: list[tuple[str, str, str]] = []   # (section_label, heading_label, mermaid_source)
    cur_h2 = ""
    cur_h3 = ""
    i = 0
    while i < len(lines):
        line = lines[i]
        h2 = re.match(r"^##\s+(.+?)$", line)
        h3 = re.match(r"^###\s+(.+?)$", line)
        if h2:
            cur_h2 = h2.group(1).strip()
            cur_h3 = ""
        elif h3:
            cur_h3 = h3.group(1).strip()
        elif line.strip() == "```mermaid":
            j = i + 1
            buf: list[str] = []
            while j < len(lines) and lines[j].strip() != "```":
                buf.append(lines[j])
                j += 1
            src = "\n".join(buf)
            diagrams.append((cur_h2, cur_h3 or cur_h2, src))
            i = j
        i += 1

    print(f"Found {len(diagrams)} mermaid blocks.\n")

    # Build unique filenames
    used: dict[str, int] = {}
    plan: list[tuple[Path, str]] = []
    for idx, (h2, h3, src) in enumerate(diagrams, start=1):
        # Prefix with section number from h2 if it starts with a digit
        m = re.match(r"^(\d+)\.\s*(.+)", h2)
        if m:
            sec_num = int(m.group(1))
            sec_name = slugify(m.group(2))
        else:
            sec_num = idx
            sec_name = slugify(h2 or h3 or f"diagram-{idx}")

        sub_label = slugify(h3) if h3 and h3 != h2 else ""
        base = f"{sec_num:02d}-{sec_name}"
        if sub_label:
            base = f"{base}__{sub_label}"
        if base in used:
            used[base] += 1
            base = f"{base}-{used[base]}"
        else:
            used[base] = 0
        plan.append((HERE / f"{base}.png", src))

    ok = 0
    for dest, src in plan:
        print(f"-> {dest.name}", flush=True)
        if render(src, dest):
            ok += 1
        else:
            print(f"  FAILED: {dest.name}", flush=True)
    print(f"\nDone. {ok}/{len(plan)} rendered.", flush=True)
    return 0 if ok == len(plan) else 2

if __name__ == "__main__":
    raise SystemExit(main())
