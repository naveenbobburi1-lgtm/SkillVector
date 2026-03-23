from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PATH = OUTPUT_DIR / "skillvector_app_summary_onepager.pdf"


TITLE = "SkillVector"
SUBTITLE = "One-page repo-based app summary"

SECTIONS = [
    (
        "What It Is",
        [
            "SkillVector is a full-stack career intelligence app that builds personalized learning paths from a user's profile, labor-market data, and retrieved web resources.",
            "Repo evidence shows a Next.js frontend, a FastAPI backend, PostgreSQL/pgvector storage, O*NET data loading, and multiple AI-backed services for path generation and market analysis.",
        ],
    ),
    (
        "Who It's For",
        [
            "Primary persona: learners and career-switchers who want a target-role roadmap, skill-gap analysis, and guided progression based on their current skills and preferences.",
        ],
    ),
    (
        "What It Does",
        [
            "Creates personalized multi-phase learning paths with weekly breakdowns, projects, and attached resources.",
            "Matches a desired role against O*NET data and computes market-required skills and profile gaps.",
            "Fetches real-time market signals through the Exa service plus retrieved web resources for path enrichment.",
            "Tracks phase unlocks, weekly task completion, MCQ tests, scores, and skill progression on the backend.",
            "Provides an AI assistant route with conversation context and web-backed answers.",
            "Supports video assignments with heartbeat-based anti-cheat progress tracking.",
            "Includes admin workflows for analytics, users, videos, and activity logging.",
        ],
    ),
    (
        "How It Works",
        [
            "Frontend: Next.js app routes and React components cover landing, auth, profile setup, learning path, market insights, assignments, and admin views.",
            "API layer: FastAPI mounts auth, profile, learning-path, market-insights, AI-assistant, admin, and assignment routers in `server/main.py`.",
            "Data/services: startup loads five O*NET datasets into `ONET_CACHE`; SQLAlchemy models store users, profiles, paths, tests, caches, assignments, and progress in PostgreSQL, including pgvector-backed RAG cache tables.",
            "Flow: user profile -> role match and market context -> path generation/query planning/resource retrieval -> persisted learning path and progress -> frontend views and report export.",
        ],
    ),
    (
        "How To Run",
        [
            "Backend: `cd server`, create/activate a venv, `pip install -r requirements.txt`, copy `.env.example` to `.env`, then run `uvicorn main:app --reload`.",
            "Frontend: `cd frontend`, `npm install`, copy `.env.local.example` to `.env.local`, then run `npm run dev`.",
            "Required local services: PostgreSQL with `pgvector`; backend code also references `GROQ_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, and database/JWT settings.",
            "Not found in repo: a migration/setup command for database schema creation beyond app startup; `MISTRAL_API_KEY` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are referenced in docs/UI context but are not present in the checked-in env example files.",
        ],
    ),
]

EVIDENCE = (
    "Evidence: README.md, frontend/package.json, frontend/app/page.tsx, "
    "frontend/lib/exportReport.ts, server/main.py, server/routes/*.py, "
    "server/db/models.py, server/services/exa_market_service.py, "
    "server/requirements.txt, server/.env.example, frontend/.env.local.example."
)


def wrap_text(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if stringWidth(trial, font_name, font_size) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def measure_layout(body_size: float, bullet_size: float, heading_size: float, footer_size: float) -> tuple[float, dict]:
    page_width, page_height = letter
    margin = 36
    x = margin
    width = page_width - 2 * margin
    y = page_height - margin
    leading = body_size * 1.3
    bullet_indent = 10
    section_gap = 8

    y -= 24
    y -= 12

    section_lines: dict[str, list[list[str]]] = {}
    for title, items in SECTIONS:
        y -= heading_size + 3
        wrapped_items: list[list[str]] = []
        for item in items:
            item_width = width - bullet_indent - 6
            lines = wrap_text(item, "Helvetica", bullet_size if len(items) > 1 else body_size, item_width)
            wrapped_items.append(lines)
            y -= len(lines) * leading
            y -= 2
        y -= section_gap
        section_lines[title] = wrapped_items

    footer_lines = wrap_text(EVIDENCE, "Helvetica", footer_size, width)
    y -= len(footer_lines) * (footer_size * 1.25)
    y -= 8

    used_height = page_height - y - margin
    available_height = page_height - 2 * margin
    return used_height - available_height, section_lines


def choose_sizes() -> tuple[float, float, float, float, dict]:
    candidates = [
        (9.2, 8.8, 11.0, 6.8),
        (8.9, 8.5, 10.7, 6.6),
        (8.6, 8.2, 10.4, 6.4),
        (8.3, 7.9, 10.1, 6.2),
        (8.0, 7.6, 9.8, 6.0),
    ]
    for sizes in candidates:
        overflow, lines = measure_layout(*sizes)
        if overflow <= 0:
            return (*sizes, lines)
    sizes = candidates[-1]
    _, lines = measure_layout(*sizes)
    return (*sizes, lines)


def render() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    page_width, page_height = letter
    margin = 36
    width = page_width - 2 * margin
    body_size, bullet_size, heading_size, footer_size, wrapped = choose_sizes()
    leading = body_size * 1.3

    c = canvas.Canvas(str(OUTPUT_PATH), pagesize=letter)

    c.setFillColor(colors.HexColor("#0F172A"))
    c.rect(0, page_height - 54, page_width, 54, stroke=0, fill=1)
    c.setFillColor(colors.HexColor("#38BDF8"))
    c.rect(0, page_height - 58, page_width, 4, stroke=0, fill=1)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(margin, page_height - 30, TITLE)
    c.setFont("Helvetica", 9)
    c.drawString(margin, page_height - 43, SUBTITLE)

    y = page_height - 72

    for title, items in SECTIONS:
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", heading_size)
        c.drawString(margin, y, title)
        y -= heading_size + 3

        wrapped_items = wrapped[title]
        for idx, lines in enumerate(wrapped_items):
            is_bullet_section = len(items) > 1 or title in {"What It Does", "How It Works", "How To Run"}
            text_font = bullet_size if is_bullet_section else body_size
            c.setFont("Helvetica", text_font)
            c.setFillColor(colors.HexColor("#1F2937"))
            bullet_x = margin + 2
            text_x = margin + 12
            if is_bullet_section:
                c.setFont("Helvetica-Bold", text_font)
                c.drawString(bullet_x, y, "-")
                c.setFont("Helvetica", text_font)
            else:
                text_x = margin

            for line in lines:
                c.drawString(text_x, y, line)
                y -= leading
            y -= 2
        y -= 8

    c.setStrokeColor(colors.HexColor("#CBD5E1"))
    c.line(margin, 42, page_width - margin, 42)
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", footer_size)
    footer_y = 34
    for line in wrap_text(EVIDENCE, "Helvetica", footer_size, width):
        c.drawString(margin, footer_y, line)
        footer_y -= footer_size * 1.25

    c.save()
    return OUTPUT_PATH


if __name__ == "__main__":
    path = render()
    print(path)
