#!/usr/bin/env node
/**
 * EDINET DB MCP server (stdio).
 *
 * Exposes structured financial and corporate data for Japanese listed
 * companies, sourced from EDINET (Japan's Financial Services Agency filing
 * system) and processed by EDINET DB. Every tool is a thin, typed wrapper over
 * the public EDINET DB REST API documented at https://edinetdb.jp/docs/api
 *
 * Auth: set EDINETDB_API_KEY. A free key is available at
 * https://edinetdb.jp/developers . Listing tools does not require a key; only
 * calling them does.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.EDINETDB_BASE_URL || "https://edinetdb.jp/v1";
const API_KEY = process.env.EDINETDB_API_KEY || "";
const TIMEOUT_MS = Number(process.env.EDINETDB_TIMEOUT_MS || 30000);

const RANKING_METRICS = [
  "avg-age", "avg-annual-salary", "credit-score", "cross-holding-book-value",
  "cross-holding-count", "director-count", "dividend-yield", "doe",
  "earnings-yield", "effective-tax-rate", "eps", "eps-cagr-3y", "eps-growth",
  "equity-ratio", "ev", "ev-ebitda", "fcf-yield", "female-director-ratio",
  "female-manager-ratio", "forecast-doe", "free-cf", "ghg-scope1-2",
  "greenblatt-roic", "greenblatt-roic-ebitda", "health-score",
  "large-shareholder-count", "main-customers-count", "male-parental-leave-ratio",
  "market-cap", "net-margin", "ni-cagr-3y", "ni-growth", "oi-cagr-3y",
  "operating-margin", "payout-ratio", "pbr", "per", "profit-before-tax", "psr",
  "revenue", "revenue-cagr-3y", "revenue-growth", "roa", "roe", "roic",
  "segment-count", "shares-change-10y", "shares-change-5y", "subsidiary-count",
];

const PEER_METRICS = [
  "roe", "roa", "roic", "operating_margin", "net_margin", "equity_ratio",
  "de_ratio", "asset_turnover", "revenue_growth_yoy", "revenue_cagr_5y",
];

const CODE = {
  type: "string",
  description:
    "EDINET code of the company, e.g. E02144 (Toyota Motor) or E02367 (Nintendo). " +
    "This is not the securities code — resolve a name or securities code to an " +
    "EDINET code with search_companies first.",
};

/** Tool catalogue. Each entry maps 1:1 onto one REST endpoint. */
const TOOLS = [
  {
    name: "search_companies",
    description:
      "Resolve a company name, EDINET code, or securities code to a company " +
      "record. Use this first when you know WHO you are looking for and need " +
      "its EDINET code for the other tools. For finding companies by numeric " +
      "criteria you do not yet have a name for, use screen_companies instead.",
    path: () => "/search",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Company name, EDINET code, or securities code. Japanese or English." },
        limit: { type: "integer", description: "Maximum results (default 20).", minimum: 1, maximum: 100 },
        include_delisted: {
          type: "boolean",
          description:
            "Include companies that were once listed but have since delisted. " +
            "Useful for resolving former names and retired securities codes. Default false.",
        },
      },
      required: ["q"],
    },
  },
  {
    name: "get_company",
    description:
      "Get the full profile of one company: identifiers, industry, market " +
      "segment, headcount and the most recent reported financial summary. " +
      "This is the general 'tell me about this company' tool; for a multi-year " +
      "numeric series use get_financials.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}`,
    inputSchema: {
      type: "object",
      properties: {
        code: CODE,
        fields: {
          type: "string",
          description:
            "Comma-separated field sets to return, to keep responses small " +
            "(e.g. 'profile,financials'). Omit to return everything.",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "get_financials",
    description:
      "Get the multi-year financial statement time series for one company — " +
      "revenue, operating income, net income, assets, equity and cash flow per " +
      "period. Figures come from XBRL in the company's own regulatory filings; " +
      "no language model is involved in producing them.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}/financials`,
    inputSchema: {
      type: "object",
      properties: {
        code: CODE,
        years: { type: "integer", description: "Number of most recent years to return. Omit for the full history.", minimum: 1 },
        period: {
          type: "string",
          enum: ["annual", "quarterly", "quarterly_standalone"],
          description:
            "annual (default) = fiscal-year figures from annual securities reports. " +
            "quarterly = year-to-date cumulative figures. " +
            "quarterly_standalone = the discrete quarter on its own.",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "get_segments",
    description:
      "Get the reported business-segment breakdown for one company: revenue, " +
      "operating income, assets, depreciation and capital expenditure per " +
      "segment. Use this to see which part of a business actually earns money, " +
      "which consolidated totals in get_financials cannot show.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}/segments`,
    inputSchema: {
      type: "object",
      properties: {
        code: CODE,
        fiscal_year: { type: "integer", description: "Restrict to one fiscal year. Omit for all disclosed years, newest first." },
        period: { type: "string", enum: ["annual", "quarterly"], description: "annual (default) or quarterly segment disclosures." },
        quarter: { type: "integer", enum: [1, 2, 3], description: "Only valid with period=quarterly. Year-to-date figures as of Q1/Q2/Q3." },
      },
      required: ["code"],
    },
  },
  {
    name: "get_earnings",
    description:
      "Get a company's quarterly earnings releases (決算短信) newest first, " +
      "including reported results and management's own forecast for the year. " +
      "These arrive weeks before the annual report, so use this for the latest " +
      "numbers and get_financials for the audited long-run series.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}/earnings`,
    inputSchema: {
      type: "object",
      properties: {
        code: CODE,
        limit: { type: "integer", description: "Number of releases to return (default 8).", minimum: 1 },
        include_qualitative_text: { type: "boolean", description: "Include management's full qualitative commentary. Default false." },
      },
      required: ["code"],
    },
  },
  {
    name: "get_disclosures",
    description:
      "List the regulatory documents one company filed in a given period, with " +
      "filing dates and document types. Use this to answer 'what did they file " +
      "and when'; use get_text_blocks to read the narrative content of a filing.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}/disclosures`,
    inputSchema: {
      type: "object",
      properties: {
        code: CODE,
        since: { type: "string", description: "Start date, YYYY-MM-DD." },
        until: { type: "string", description: "End date, YYYY-MM-DD." },
        month: { type: "string", description: "Single month, YYYY-MM." },
        types: { type: "string", description: "Comma-separated document type filter, e.g. 'tanshin,yuho'." },
      },
      required: ["code"],
    },
  },
  {
    name: "get_text_blocks",
    description:
      "Read the narrative sections of a company's annual securities report — " +
      "business overview, risk factors, and management's discussion and " +
      "analysis — as the original filed Japanese text. Returns a 2,000-character " +
      "excerpt per section unless full is set.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}/text-blocks`,
    inputSchema: {
      type: "object",
      properties: {
        code: CODE,
        fiscal_year: { type: "integer", description: "Fiscal year to read. Omit for the most recent." },
        sections: { type: "string", description: "Comma-separated section filter, e.g. 'risks,mda,business'. Omit for all sections." },
        full: { type: "boolean", description: "Return the complete text instead of an excerpt. Default false." },
      },
      required: ["code"],
    },
  },
  {
    name: "get_directors",
    description:
      "Get the board roster disclosed by one company: each director and " +
      "corporate auditor with their title, responsibilities, tenure and " +
      "shareholding. Answers governance and board-composition questions.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}/directors`,
    inputSchema: {
      type: "object",
      properties: {
        code: CODE,
        fiscal_year: { type: "integer", description: "Restrict to one fiscal year. Omit for all disclosed years, newest first." },
      },
      required: ["code"],
    },
  },
  {
    name: "get_shareholders",
    description:
      "Get the large-shareholding reports filed against one company — who has " +
      "declared a stake of 5% or more, at what ratio, and as of when. This is " +
      "the issuer-side view; to go the other way and see everything one " +
      "investor holds, use search_shareholders.",
    path: (a) => `/companies/${encodeURIComponent(a.code)}/shareholders`,
    inputSchema: {
      type: "object",
      properties: { code: CODE },
      required: ["code"],
    },
  },
  {
    name: "search_shareholders",
    description:
      "Look up an investor by name and get every listed company where it has " +
      "filed a large-shareholding report. This is the reverse of " +
      "get_shareholders: start from the holder, not the issuer.",
    path: () => "/shareholders/search",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Investor or fund name, partial match. Japanese or English, e.g. 'ブラックロック'." },
        limit: { type: "integer", description: "Maximum results (default 20).", minimum: 1, maximum: 100 },
      },
      required: ["q"],
    },
  },
  {
    name: "screen_companies",
    description:
      "Filter the whole universe of Japanese listed companies by numeric and " +
      "categorical criteria combined with AND, and sort the survivors. Use this " +
      "when you are looking for companies that match a profile; use " +
      "search_companies when you already know which company you mean.",
    path: () => "/screener",
    inputSchema: {
      type: "object",
      properties: {
        conditions: {
          type: "string",
          description:
            'Conditions as a JSON array, e.g. \'[{"metric":"roe","operator":"gte","value":10}]\'. ' +
            "Operators are gte, lte, gt, lt and eq.",
        },
        industry: { type: "string", description: "Industry name in Japanese, e.g. '情報・通信業'." },
        market: { type: "string", enum: ["prime", "standard", "growth"], description: "Tokyo Stock Exchange market segment." },
        standard: { type: "string", enum: ["JP", "IFRS", "US"], description: "Accounting standard the company reports under." },
        fiscal_year_end: { type: "integer", minimum: 1, maximum: 12, description: "Fiscal year-end month, 1-12." },
        sort: { type: "string", description: "Metric to sort by. Defaults to the metric of the first condition." },
        order: { type: "string", enum: ["asc", "desc"], description: "Sort direction. Default desc." },
        limit: { type: "integer", description: "Maximum results (default 100).", minimum: 1 },
        offset: { type: "integer", description: "Result offset for paging. Default 0.", minimum: 0 },
      },
    },
  },
  {
    name: "get_ranking",
    description:
      "Get the market-wide league table for one metric — the top companies by " +
      "return on equity, market capitalisation, dividend yield, female director " +
      "ratio and 45 others. Use this for 'who is highest on X'; use " +
      "screen_companies when you need several conditions at once.",
    path: (a) => `/rankings/${encodeURIComponent(a.metric)}`,
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string", enum: RANKING_METRICS, description: "The metric to rank by." },
        limit: { type: "integer", description: "Number of ranked companies to return (default 100).", minimum: 1 },
      },
      required: ["metric"],
    },
  },
  {
    name: "compare_peers",
    description:
      "Benchmark one company against its industry peers on a single metric " +
      "over several years, returning the company's own series, each peer's " +
      "series and the industry distribution. Answers 'is this good?', which a " +
      "single company's numbers alone cannot.",
    path: () => "/queries/peer-comparison",
    inputSchema: {
      type: "object",
      properties: {
        company: CODE,
        metric: { type: "string", enum: PEER_METRICS, description: "The metric to compare on." },
        years: { type: "integer", description: "Years of history (default 5).", minimum: 1 },
        peer_count: { type: "integer", description: "Number of peers to include (default 5).", minimum: 1 },
      },
      required: ["company", "metric"],
    },
  },
];

const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

async function callApi(tool, args) {
  if (!API_KEY) {
    throw new Error(
      "EDINETDB_API_KEY is not set. Get a free API key at " +
        "https://edinetdb.jp/developers and expose it to this server as the " +
        "EDINETDB_API_KEY environment variable."
    );
  }

  const url = new URL(BASE_URL + tool.path(args));
  const pathParams = new Set(["code", "metric"]);
  for (const [key, value] of Object.entries(args ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (pathParams.has(key) && url.pathname.includes(encodeURIComponent(String(value)))) continue;
    url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "X-API-Key": API_KEY,
        Accept: "application/json",
        "User-Agent": "edinet-db-mcp/1.0.0",
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`EDINET DB request timed out after ${TIMEOUT_MS}ms: ${url.pathname}`);
    }
    throw new Error(`Could not reach EDINET DB (${url.pathname}): ${error?.message ?? error}`);
  } finally {
    clearTimeout(timer);
  }

  const body = await response.text();
  if (!response.ok) {
    let detail = body.slice(0, 600);
    try {
      detail = JSON.stringify(JSON.parse(body)).slice(0, 600);
    } catch {}
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `EDINET DB rejected the API key (HTTP ${response.status}). Check EDINETDB_API_KEY. ${detail}`
      );
    }
    if (response.status === 429) {
      throw new Error(
        `EDINET DB rate limit reached (HTTP 429). Free keys allow 100 requests per day; ` +
          `see https://edinetdb.jp/pricing . ${detail}`
      );
    }
    throw new Error(`EDINET DB returned HTTP ${response.status} for ${url.pathname}. ${detail}`);
  }
  return body;
}

const server = new Server(
  { name: "edinet-db", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = BY_NAME.get(request.params.name);
  if (!tool) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
    };
  }
  try {
    const text = await callApi(tool, request.params.arguments ?? {});
    return { content: [{ type: "text", text }] };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error?.message ?? String(error) }],
    };
  }
});

async function main() {
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error("edinet-db-mcp failed to start:", error);
  process.exit(1);
});
