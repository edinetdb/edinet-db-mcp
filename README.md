# EDINET DB MCP Server

[![Live](https://img.shields.io/badge/status-production-green)](https://edinetdb.jp/mcp) [![Users](https://img.shields.io/badge/users-5000%2B-blue)](https://edinetdb.jp) [![License](https://img.shields.io/badge/data%20license-mixed%20open--gov-orange)](https://edinetdb.jp/docs/data-sources)

**Remote MCP server for Japan's EDINET DB** — structured financial data for ~3,800 Japanese listed companies, served over HTTPS with OAuth 2.0 multi-tenant authentication.

- 🌐 **Endpoint**: `https://edinetdb.jp/mcp`
- 🔐 **Auth**: OAuth 2.0 (or API key)
- 👥 **Users**: 5,000+ authenticated developers, analysts, and academic researchers
- 📅 **Production since**: 2026-03-01
- 🇯🇵 **First** remote MCP service for Japanese listed-company filings (by author's research as of 2026-02 month-end)

## What it does

EDINET DB exposes structured financial and corporate data extracted from Japan's regulatory filings (EDINET, by the Financial Services Agency) plus public open data (gBizINFO from METI, National Tax Agency corporate registry, Wikidata). Connect from Claude Desktop, Claude Code, Cursor, Codex CLI, or any MCP-compatible client to query company financials, HR/diversity disclosures, supply chains, patents, executive profiles, and corporate history via natural language.

## Quick start

### Claude Desktop (Custom Connector)

1. Open Claude Desktop → Settings → Custom Connectors
2. Add Connector:
   - **Name**: EDINET DB
   - **URL**: `https://edinetdb.jp/mcp`
   - **Auth**: OAuth 2.0 (discovery: `https://edinetdb.jp/mcp/.well-known/oauth-authorization-server`)
3. Sign in with your edinetdb.jp account (free signup at https://edinetdb.jp/signup)

### Claude Code

```bash
claude mcp add edinetdb https://edinetdb.jp/mcp --transport http
```

### Cursor

`.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "edinetdb": {
      "url": "https://edinetdb.jp/mcp",
      "transport": "streamable-http"
    }
  }
}
```

### Codex CLI

```bash
codex mcp add edinetdb https://edinetdb.jp/mcp
```

## Tools (25)

- `get_company` — Company profile + latest financials
- `get_financials` — Up to 6 years of historical financials
- `get_analysis` — AI-generated health score, peer comparison
- `search_companies` / `search_companies_batch` — Name/industry/financial-criteria search
- `get_ranking` — Industry rankings by metric (ROE, revenue, etc.)
- `screen_companies` — 106-metric screener
- `get_text_blocks` / `get_text_blocks_structured` — Full-text annual report sections + LLM-extracted structured data
- `get_compensation_text` — Executive compensation disclosures
- `get_earnings` / `get_earnings_calendar` — Quarterly earnings flash + JPX disclosure schedule
- `get_detailed_expenses` — SG&A breakdown (14 categories × 4 groups)
- `get_cross_shareholdings` — Policy shareholdings detail (263K records)
- `get_directors` / `get_parent_company` / `get_related_party_transactions` / `get_main_customers` — Corporate graph
- `get_segments` — Business segments
- `get_company_history` — Corporate history events (246K events, 4,526 companies)
- `get_ir_documents` — IR PDFs (integrated reports, mid-term plans, sustainability)
- `get_watchlist` / `add_to_watchlist` / `remove_from_watchlist` — Personal watchlist
- `get_documentation` — Inline help & methodology

## Data sources

| Source | Coverage | License |
|---|---|---|
| **EDINET** (FSA Japan) | Annual securities reports, quarterly reports, large shareholder reports | Public-sector open data |
| **gBizINFO** (METI) | Corporate basic attributes, patents, subsidies, government procurement | CC BY 4.0 compatible (政府標準利用規約 第2.0版) |
| **Corporate Number Publication Site** (NTA) | Corporate number, basic 3 fields | 公共データ利用規約 第1.0版 |
| **Wikidata** | Official website URLs | CC0 |
| AI-generated content (corporate history narrative, etc.) | Always labeled, with source event IDs, timestamps, and disclaimers | — |

We do not redistribute exchange-licensed data (real-time stock prices, TDnet). See https://edinetdb.jp/docs/data-sources for the full breakdown.

## Pricing

| Plan | Price (JPY/month) | API/MCP req/day |
|---|---|---|
| Free | ¥0 | 100 |
| Pro | ¥4,980 | 1,000 |
| Business | ¥29,800 | 10,000 |
| Enterprise | Contact | Custom |
| Academy | Free for accredited researchers | Custom |

Details: https://edinetdb.jp/pricing

## Position vs. similar projects

EDINET DB is the production-grade, OAuth-authenticated, multi-tenant SaaS remote MCP for Japanese financial filings. Other Japan-specific MCP servers (e.g., bug-tracker for individual contributors) are local stdio implementations requiring users to obtain their own API keys and run a local process. The 5,000+ authenticated user base reflects production usage since 2026-03-01.

## Languages

- Japanese (primary), English (secondary, growing)
- Tools accept queries in both languages, response language follows MCP client `Accept-Language`

## License & terms

- **Data**: see "Data sources" table above; each field carries a `source` attribute
- **Service**: per https://edinetdb.jp/terms
- **Not an official endorsement of any governmental body**

## Links

- 🌐 Service: https://edinetdb.jp
- 📚 Docs: https://edinetdb.jp/docs/api
- 🔌 MCP guide: https://edinetdb.jp/docs/mcp-guide
- 📊 Data quality SLA: https://edinetdb.jp/docs/data-quality
- 🐛 Issues: https://github.com/edinetdb/edinet-db-mcp/issues
- ✉️ Contact: edinetdb@cabocia.jp

---

Operated by [Cabocia Inc.](https://cabocia.jp) — building data infrastructure for the AI agent era.
