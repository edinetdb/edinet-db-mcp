# EDINET DB MCP Server

[![Live](https://img.shields.io/badge/status-production-green)](https://edinetdb.jp/mcp) [![Users](https://img.shields.io/badge/users-9000%2B-blue)](https://edinetdb.jp) [![License](https://img.shields.io/badge/data%20license-mixed%20open--gov-orange)](https://edinetdb.jp/docs/data-sources)

**Remote MCP server for Japan's EDINET DB** — structured financial data for ~3,800 Japanese listed companies, served over HTTPS with OAuth 2.0 multi-tenant authentication.

- 🌐 **Endpoint**: `https://edinetdb.jp/mcp`
- 🔐 **Auth**: OAuth 2.0 (or API key)
- 👥 **Users**: 9,000+ registered developers, analysts, and academic researchers
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

## Tools (75)

**Company & financials**
- `get_company` — Company profile + latest financials (XBRL-sourced, no LLM)
- `get_financials` — Multi-year financial time series
- `get_analysis` — Rule-based financial health score (0-100) and key-metrics summary
- `compare_companies` — Side-by-side comparison of 2-10 companies for one fiscal year
- `get_industry_benchmark` — Industry median and P25/P75 quartiles
- `get_fair_value` — Deterministic, non-advisory valuation model estimates
- `get_segments` — Business segment revenue, operating income, capex, assets
- `get_detailed_expenses` — SG&A breakdown from the PL notes
- `get_order_backlog` — Orders received, order backlog, production and sales volumes
- `get_earnings` — Quarterly earnings flash (決算短信), newest first
- `get_earnings_calendar` — Scheduled earnings announcement dates

**Search & screening**
- `search_companies` — Search by name, securities code, industry, or health score
- `search_companies_batch` — Many companies in one call
- `screen_companies` — Screener over 100+ metrics with AND logic
- `get_ranking` — Top companies by a financial, human-capital or ESG metric
- `search_corporate_master` — National Tax Agency corporate-number database (5.8M+ active corporations)
- `get_corporate_profile` — Profile by 13-digit corporate number, listed or not
- `get_events` — Normalized corporate events across filings, earnings and holdings
- `get_appearances` — Reverse-lookup: how a company appears in *other* companies' filings

**Filings: full text & structured extraction**
- `get_text_blocks` — Raw full text from annual securities reports
- `get_text_blocks_structured` — Pre-extracted structured data points from those sections
- `get_compensation_text` — Director and officer compensation disclosures
- `get_company_history` — Corporate history timeline (沿革) as structured events

**Shareholders**
- `get_shareholders` — Large shareholding reports (大量保有報告書), latest per filer group
- `search_shareholders` — Which companies a given filer holds
- `get_shareholder_history` — Shareholding time series for a filer-issuer pair
- `get_shareholder_transactions` — Trade-level detail from the 60-day acquisition/disposal table
- `get_activist_positions` — Current activist positions across the market
- `get_shareholder_categories` — Ownership by shareholder category (所有者別状況)
- `get_major_shareholders` — Top-10 major shareholders snapshot
- `get_cross_shareholdings` — Per-issuer policy shareholdings (政策保有株式)

**Corporate graph**
- `get_directors` — Directors and corporate auditors (役員一覧)
- `get_director_compensation` — Granular compensation breakdown per officer group
- `get_parent_company` / `get_parent_companies` — Disclosed parent and reverse-declared parents
- `get_subsidiaries` — Consolidated subsidiaries and equity-method affiliates (関係会社の状況)
- `get_gleif_subsidiaries` — Consolidated subsidiaries from GLEIF Level 2
- `get_related_party_transactions` — Related-party transactions (関連当事者との取引)
- `get_main_customers` — Disclosed main customers (主要販売先) graph

**Assets & facilities**
- `get_real_estate` — Land, buildings and investment property book values
- `get_facilities` — Facility-level major properties (主要な設備の状況)

**IR documents & knowledge graph**
- `get_ir_documents` — IR PDFs: integrated reports, mid-term plans, sustainability reports
- `get_ir_pdf_url` — Signed download URL for an IR PDF
- `list_ir_document_types` — Available IR document type slugs
- `search_ir_sections` / `get_ir_sections_by_company` — Section-level IR content search
- `search_qa_sections` — Q&A content from earnings presentations
- `search_ir_kpis` / `get_ir_kpis_by_company` — Numeric KPIs from mid-term plans and integrated reports
- `search_kg_strategies` — Strategy entities extracted across companies
- `search_kg_kpi_commitments` — Committed numerical targets
- `get_kg_company_summary` — Knowledge-graph summary for one company
- `get_kg_kpi_track_record` — KPI commitments, observations and revisions
- `find_peer_strategies` — Peer strategies that overlap thematically

**Watchlist, dashboard & notifications**
- `get_watchlist` / `add_to_watchlist` / `remove_from_watchlist` — Personal watchlist
- `dashboard_list_modules` / `dashboard_get_feed` / `dashboard_add_module` / `dashboard_remove_module` / `dashboard_update_params` — Dashboard modules and live feeds
- `subscribe_notifications` / `list_notification_subscriptions` / `unsubscribe_notifications` — Email digests

**Saved analyses**
- `save_analysis` / `list_my_analyses` / `run_analysis` / `delete_analysis` — Re-runnable named analyses

**Data quality feedback**
- `report_data_issue` / `report_financial_data_issue` — Flag an error or missing data
- `get_data_issue` — Status of a report you filed
- `request_data` / `list_my_data_requests` — Request data that is missing entirely

**Docs**
- `get_documentation` — Inline help, tool catalog and methodology

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

EDINET DB is the production-grade, OAuth-authenticated, multi-tenant SaaS remote MCP for Japanese financial filings. Other Japan-specific MCP servers (e.g., bug-tracker for individual contributors) are local stdio implementations requiring users to obtain their own API keys and run a local process. The 9,000+ registered user base reflects production usage since 2026-03-01.

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
