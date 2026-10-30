"""Annotated screenshots for the admin documentation (/admin/docs).

Runs on the local machine against the local dev servers (web :3000, API :8000). Signs in as a demo
account, opens a page, optionally performs steps, draws numbered red boxes with a pointer on the
elements to explain, and saves a PNG under apps/web/public/docs/.

    python scripts/docs/capture.py scripts/docs/specs/<page>.json --password <demo password>

Spec file:
{
  "out_dir": "apps/web/public/docs/<page-slug>",
  "shots": [{
    "name": "overview",                    # -> <out_dir>/overview.png
    "account": "patient1@vitalnex.demo",   # omit for a signed-out page
    "path": "/dashboard",
    "width": 1440, "height": 900,          # optional viewport
    "steps": [                             # optional, run in order
      {"click": "text=Start"}, {"fill": ["input[name=age]", "45"]}, {"select": ["select#x", "1"]},
      {"press": "Enter"}, {"wait": 1000}, {"wait_for": "text=Results"}, {"scroll_to": "#section"}
    ],
    "marks": [{"selector": "nav a[href='/history']", "n": 1, "label": "History"}],
    "clip": "main"                         # optional: crop to this element (plus a margin)
  }]
}
Selectors are Playwright selectors (CSS, text=..., role=...). The UI is always forced to English.
"""

import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
RED = "#E11D48"

# Draws the marks as one fixed SVG over the viewport, using each element's on-screen box.
DRAW_JS = """
([marks, color]) => {
  document.getElementById('__doc_marks')?.remove();
  const W = window.innerWidth, H = window.innerHeight, ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = '__doc_marks';
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none';
  document.body.appendChild(svg);  // attached first so label widths can be measured
  const el = (tag, attrs, parent) => { const e = document.createElementNS(ns, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
  for (const m of marks) {
    const pad = m.pad ?? 6, r = m.rect;
    const x = r.x - pad, y = r.y - pad, w = r.width + 2 * pad, h = r.height + 2 * pad;
    el('rect', {x, y, width: w, height: h, rx: 10, fill: 'rgba(225,29,72,0.06)', stroke: color, 'stroke-width': 3});
    // Badge sits up-left of the box when there is room, otherwise inside the top-left corner.
    let bx = x - 22, by = y - 22;
    if (bx < 16) bx = x + 16; if (by < 16) by = y + 16;
    el('line', {x1: bx, y1: by, x2: x + 4, y2: y + 4, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round'});
    el('circle', {cx: bx, cy: by, r: 14, fill: color, stroke: 'white', 'stroke-width': 2.5});
    const t = el('text', {x: bx, y: by + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700,
      fill: 'white', 'font-family': 'Arial, sans-serif'}); t.textContent = m.n;
    if (m.label) {
      const lx = bx + 20, ly = by - 12;
      const g = el('g', {});
      const txt = el('text', {x: lx + 8, y: ly + 17, 'font-size': 13, 'font-weight': 700, fill: 'white',
        'font-family': 'Arial, sans-serif'}, g); txt.textContent = m.label;
      const tw = txt.getComputedTextLength();
      const bg = el('rect', {x: lx, y: ly, width: tw + 16, height: 24, rx: 12, fill: color}, g);
      g.insertBefore(bg, txt);
    }
  }
}
"""


def sign_in(page: Page, base: str, email: str, password: str) -> None:
    page.goto(f"{base}/auth/login")
    page.fill("input[type=email]", email)
    page.fill("input[type=password]", password)
    page.click("button[type=submit]")
    page.wait_for_url(lambda url: "/auth/login" not in url, timeout=45_000)
    page.wait_for_load_state("networkidle")


def run_step(page: Page, step: dict) -> None:
    if "click" in step:
        page.click(step["click"], timeout=20_000)
    elif "fill" in step:
        page.fill(step["fill"][0], step["fill"][1], timeout=20_000)
    elif "select" in step:
        page.select_option(step["select"][0], step["select"][1], timeout=20_000)
    elif "check" in step:
        page.check(step["check"], timeout=20_000)
    elif "press" in step:
        page.keyboard.press(step["press"])
    elif "wait" in step:
        page.wait_for_timeout(step["wait"])
    elif "wait_for" in step:
        page.wait_for_selector(step["wait_for"], timeout=45_000)
    elif "scroll_to" in step:
        page.locator(step["scroll_to"]).first.scroll_into_view_if_needed(timeout=20_000)
    else:
        raise ValueError(f"unknown step: {step}")


def capture(spec_path: Path, base: str, password: str, only: set) -> int:
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    out_dir = ROOT / spec["out_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        contexts: dict = {}
        for shot in spec["shots"]:
            if only and shot["name"] not in only:
                continue
            account = shot.get("account")
            size = {"width": shot.get("width", 1440), "height": shot.get("height", 900)}
            try:
                if account not in contexts:
                    ctx = browser.new_context(viewport=size, device_scale_factor=1)
                    ctx.add_init_script(
                        "try { localStorage.setItem('vitalnex_lang', 'en') } catch (e) {}"
                        # hide the Next.js dev-mode badge
                        "document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style');"
                        " s.textContent = 'nextjs-portal{display:none!important}'; document.head.appendChild(s); });"
                    )
                    if account:
                        sign_in(ctx.new_page(), base, account, password)
                    contexts[account] = ctx
                page = contexts[account].new_page()
                page.set_viewport_size(size)
                page.goto(f"{base}{shot['path']}")
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(shot.get("settle", 1500))
                for step in shot.get("steps", []):
                    run_step(page, step)
                marks = []
                for m in shot.get("marks", []):
                    loc = page.locator(m["selector"]).first
                    loc.scroll_into_view_if_needed(timeout=20_000)
                    marks.append({**m, "rect": None})
                page.wait_for_timeout(300)
                for m in marks:
                    m["rect"] = page.locator(m["selector"]).first.bounding_box()
                    if m["rect"] is None:
                        raise RuntimeError(f"mark {m['n']} not visible: {m['selector']}")
                page.evaluate(DRAW_JS, [marks, RED])
                kwargs = {}
                if shot.get("clip"):
                    box = page.locator(shot["clip"]).first.bounding_box()
                    if box:
                        mg = 40
                        x, y = max(box["x"] - mg, 0), max(box["y"] - mg, 0)
                        kwargs["clip"] = {
                            "x": x, "y": y,
                            "width": min(box["width"] + 2 * mg, size["width"] - x),
                            "height": min(box["height"] + 2 * mg, size["height"] - y),
                        }
                target = out_dir / f"{shot['name']}.png"
                page.screenshot(path=str(target), **kwargs)
                print(f"OK   {target.relative_to(ROOT)}")
                page.close()
            except Exception as e:  # report and continue with the next shot
                failed += 1
                print(f"FAIL {shot['name']}: {e}".splitlines()[0])
        browser.close()
    return failed


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("spec", type=Path)
    ap.add_argument("--password", required=True, help="demo account password")
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--only", nargs="*", default=[], help="shot names to (re)capture")
    a = ap.parse_args()
    sys.exit(1 if capture(a.spec.resolve(), a.base, a.password, set(a.only)) else 0)


if __name__ == "__main__":
    main()
