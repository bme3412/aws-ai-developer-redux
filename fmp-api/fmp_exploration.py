#!/usr/bin/env python3
"""
FMP API Exploration Script — Phase 1: Get to Know the Data
===========================================================

Purpose: Hands-on exploration of Financial Modeling Prep API data
for someone building systematic investment tools.

Setup:
    pip install requests pandas tabulate

    # Set your API key:
    export FMP_API_KEY="your_key_here"

    # Then run individual exercises:
    python fmp_exploration.py --exercise 1
    python fmp_exploration.py --exercise all

Notes on Free Plan (250 requests/day):
    - Most endpoints work but with limited history (5yr annual)
    - Bulk endpoints require Pro plan
    - Earnings transcripts may be limited
    - Analyst estimates may be limited
    - Script tracks request count so you don't burn your daily quota

Author: Brendan — Acadian Investment AI Engineer prep
"""

import os
import sys
import json
import time
import argparse
import requests
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

# ============================================================
# CONFIG
# ============================================================

API_KEY = os.environ.get("FMP_API_KEY", "")
BASE_URL_STABLE = "https://financialmodelingprep.com/stable"
BASE_URL_V3 = "https://financialmodelingprep.com/api/v3"
BASE_URL_V4 = "https://financialmodelingprep.com/api/v4"

# Companies you know well from your coverage universe
# Edit these to match your actual coverage
KNOWN_TICKERS = ["AAPL", "NVDA", "CRM", "ADBE", "MSFT"]
DEEP_DIVE_TICKER = "NVDA"  # The one you know best

# For universe construction
SECTOR_FOCUS = "Technology"

# Built-in sample universe (free tier can't fetch stock lists)
# ~100 liquid US large caps across sectors
SAMPLE_UNIVERSE = {
    "Technology": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AVGO", "ADBE", "CRM", "AMD", "INTC",
                   "ORCL", "CSCO", "IBM", "NOW", "QCOM", "TXN", "AMAT", "MU", "LRCX", "SNPS"],
    "Communication Services": ["GOOG", "NFLX", "DIS", "CMCSA", "T", "VZ", "TMUS", "EA", "WBD", "TTWO"],
    "Consumer Discretionary": ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "LOW", "TJX", "BKNG", "CMG"],
    "Consumer Staples": ["PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "CL", "MDLZ", "GIS"],
    "Financials": ["JPM", "BAC", "WFC", "GS", "MS", "BLK", "SCHW", "AXP", "C", "USB"],
    "Healthcare": ["UNH", "JNJ", "PFE", "ABBV", "MRK", "LLY", "TMO", "ABT", "BMY", "AMGN"],
    "Industrials": ["CAT", "BA", "HON", "UNP", "RTX", "DE", "LMT", "GE", "MMM", "UPS"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "HAL"],
    "Materials": ["LIN", "APD", "SHW", "ECL", "DD", "NEM", "FCX", "NUE", "VMC", "MLM"],
    "Real Estate": ["PLD", "AMT", "EQIX", "CCI", "PSA", "SPG", "O", "WELL", "DLR", "AVB"],
    "Utilities": ["NEE", "DUK", "SO", "D", "AEP", "EXC", "SRE", "XEL", "ED", "WEC"],
}

# Output directory for saved data
OUTPUT_DIR = Path("fmp_output")
OUTPUT_DIR.mkdir(exist_ok=True)

# Request tracking
REQUEST_COUNT = 0
REQUEST_LOG = []


# ============================================================
# API CLIENT
# ============================================================

def fmp_request(endpoint: str, params: dict = None, base: str = None, label: str = "") -> dict | list | None:
    """
    Make a request to FMP API with rate tracking and error handling.
    Uses the stable API by default.
    """
    global REQUEST_COUNT

    if not API_KEY:
        print("\n❌ ERROR: Set FMP_API_KEY environment variable first!")
        print("   export FMP_API_KEY='your_key_here'")
        sys.exit(1)

    base = base or BASE_URL_STABLE
    params = params or {}
    params["apikey"] = API_KEY

    url = f"{base}/{endpoint}"
    REQUEST_COUNT += 1

    try:
        resp = requests.get(url, params=params, timeout=15)
        status = resp.status_code
        REQUEST_LOG.append({
            "n": REQUEST_COUNT,
            "endpoint": endpoint,
            "status": status,
            "label": label
        })

        if status == 403:
            print(f"  ⚠️  403 Forbidden — endpoint may require paid plan: {endpoint}")
            return None
        if status == 429:
            print(f"  ⚠️  429 Rate limited — you've hit the daily cap. Try again tomorrow.")
            return None
        if status != 200:
            print(f"  ⚠️  HTTP {status} for {endpoint}")
            return None

        data = resp.json()

        # FMP sometimes returns error messages as JSON
        if isinstance(data, dict) and "Error Message" in data:
            print(f"  ⚠️  API Error: {data['Error Message']}")
            return None

        return data

    except Exception as e:
        print(f"  ❌ Request failed: {e}")
        return None


def save_json(data, filename: str):
    """Save data to JSON file in output directory."""
    path = OUTPUT_DIR / filename
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  💾 Saved to {path}")


def print_header(exercise_num: int, title: str):
    """Print a formatted exercise header."""
    print(f"\n{'='*70}")
    print(f"  EXERCISE {exercise_num}: {title}")
    print(f"{'='*70}\n")


def print_subheader(text: str):
    print(f"\n  --- {text} ---\n")


def print_table(rows: list, headers: list, max_rows: int = 20):
    """Print a simple formatted table."""
    try:
        from tabulate import tabulate
        print(tabulate(rows[:max_rows], headers=headers, tablefmt="simple"))
    except ImportError:
        # Fallback if tabulate not installed
        print("  | ".join(str(h).ljust(15) for h in headers))
        print("-" * (17 * len(headers)))
        for row in rows[:max_rows]:
            print("  | ".join(str(v).ljust(15) for v in row))
    if len(rows) > max_rows:
        print(f"  ... and {len(rows) - max_rows} more rows")


# ============================================================
# EXERCISE 1: Universe Construction
# ============================================================

def exercise_1():
    """
    Build a sample universe from built-in large-cap list.
    Fetch profiles to verify data quality.
    (Note: stock-list endpoint requires paid plan)
    """
    print_header(1, "Universe Construction")

    # 1a: Show built-in sample universe
    print("  📋 Using built-in sample universe (stock-list requires paid plan)")
    print(f"  This demonstrates what you'd do with a full universe.\n")

    total_tickers = sum(len(v) for v in SAMPLE_UNIVERSE.values())
    print(f"  📊 Sample universe: {total_tickers} tickers across {len(SAMPLE_UNIVERSE)} sectors")

    print_subheader("Universe Breakdown by Sector")
    sector_rows = [(sector, len(tickers)) for sector, tickers in SAMPLE_UNIVERSE.items()]
    sector_rows.sort(key=lambda x: -x[1])
    print_table(sector_rows, ["Sector", "Count"])

    # 1b: Flatten to list
    all_tickers = []
    for sector, tickers in SAMPLE_UNIVERSE.items():
        for t in tickers:
            all_tickers.append({"symbol": t, "sector": sector})

    # 1c: Verify a sample via API profiles
    print_subheader("Verifying Sample Profiles via API")
    print("  Fetching profiles for 5 tickers (1 per major sector)...")
    sample_tickers = ["AAPL", "JPM", "XOM", "UNH", "AMZN"]
    profiles = []

    for ticker in sample_tickers:
        profile = fmp_request("profile", {"symbol": ticker}, label=f"profile_{ticker}")
        if profile and isinstance(profile, list) and len(profile) > 0:
            p = profile[0]
            mcap = p.get("marketCap", 0)
            mcap_t = mcap / 1e12 if mcap else 0
            print(f"  ✅ {ticker}: ${mcap_t:.2f}T | {p.get('sector', 'N/A')} | {p.get('industry', 'N/A')[:35]}")
            profiles.append(p)
        else:
            print(f"  ❌ {ticker}: Failed to fetch profile")
        time.sleep(0.3)

    if profiles:
        save_json(profiles, "ex1_sample_profiles.json")

    # 1d: Save the sample universe
    save_json(all_tickers, "ex1_sample_universe.json")

    # 1e: Check our known tickers
    print_subheader("Checking Known Coverage Tickers")
    universe_set = set(t["symbol"] for t in all_tickers)
    for ticker in KNOWN_TICKERS:
        if ticker in universe_set:
            sector = next((t["sector"] for t in all_tickers if t["symbol"] == ticker), "Unknown")
            print(f"  ✅ {ticker}: In sample universe | Sector: {sector}")
        else:
            print(f"  ⚠️  {ticker}: Not in sample universe (add to SAMPLE_UNIVERSE if needed)")

    print(f"\n  💡 TAKEAWAY: Free tier requires you to know tickers upfront.")
    print(f"     stock-list and index constituents require paid plan.")
    print(f"     For production, you'd either pay for FMP or source tickers elsewhere.")
    print(f"     Acadian covers 40,000+ tradeable equity assets globally.")


# ============================================================
# EXERCISE 2: Financial Statement Deep Dive
# ============================================================

def exercise_2():
    """
    Pull financial statements for companies you know.
    Compare standardized vs as-reported. Check data quality.
    """
    print_header(2, "Financial Statement Deep Dive")
    ticker = DEEP_DIVE_TICKER

    # 2a: Income Statement (standardized)
    print(f"  Fetching income statement for {ticker} (standardized)...")
    income = fmp_request("income-statement", {"symbol": ticker, "period": "annual", "limit": 5}, label=f"income_{ticker}")

    if income and len(income) > 0:
        print_subheader(f"{ticker} — Income Statement (Annual, Last 5 Years)")
        rows = []
        for stmt in income:
            rows.append([
                stmt.get("calendarYear", "N/A"),
                f"${stmt.get('revenue', 0) / 1e9:.1f}B",
                f"${stmt.get('grossProfit', 0) / 1e9:.1f}B",
                f"{stmt.get('grossProfit', 0) / stmt.get('revenue', 1) * 100:.1f}%" if stmt.get('revenue') else "N/A",
                f"${stmt.get('operatingIncome', 0) / 1e9:.1f}B",
                f"${stmt.get('netIncome', 0) / 1e9:.1f}B",
                f"${stmt.get('eps', 0):.2f}" if stmt.get('eps') else "N/A",
            ])
        print_table(rows, ["Year", "Revenue", "Gross Profit", "GM%", "Op Income", "Net Income", "EPS"])

        save_json(income, f"ex2_income_{ticker}.json")

        # 2b: Quick data quality check
        print_subheader("Data Quality Check")
        sample = income[0]
        print(f"  Most recent period: {sample.get('date')} ({sample.get('period')})")
        print(f"  Filing date: {sample.get('fillingDate', 'N/A')}")
        print(f"  Accepted date: {sample.get('acceptedDate', 'N/A')}")
        print(f"  Currency: {sample.get('reportedCurrency', 'N/A')}")

        # Check for common data issues
        rev = sample.get("revenue", 0)
        gp = sample.get("grossProfit", 0)
        oi = sample.get("operatingIncome", 0)
        ni = sample.get("netIncome", 0)
        print(f"\n  Sanity checks:")
        print(f"    Revenue > Gross Profit > Op Income > Net Income?")
        print(f"    ${rev/1e9:.1f}B > ${gp/1e9:.1f}B > ${oi/1e9:.1f}B > ${ni/1e9:.1f}B")
        if rev > gp > oi:
            print(f"    ✅ Looks correct")
        else:
            print(f"    ⚠️  Something looks off — investigate!")

    # 2c: Balance Sheet
    print(f"\n  Fetching balance sheet for {ticker}...")
    balance = fmp_request("balance-sheet-statement", {"symbol": ticker, "period": "annual", "limit": 5}, label=f"balance_{ticker}")

    if balance and len(balance) > 0:
        print_subheader(f"{ticker} — Balance Sheet Highlights")
        rows = []
        for stmt in balance:
            ta = stmt.get("totalAssets", 0)
            tl = stmt.get("totalLiabilities", 0)
            te = stmt.get("totalStockholdersEquity", 0)
            cash = stmt.get("cashAndCashEquivalents", 0)
            debt = stmt.get("totalDebt", 0)
            rows.append([
                stmt.get("calendarYear", "N/A"),
                f"${ta / 1e9:.1f}B",
                f"${tl / 1e9:.1f}B",
                f"${te / 1e9:.1f}B",
                f"${cash / 1e9:.1f}B",
                f"${debt / 1e9:.1f}B",
            ])
        print_table(rows, ["Year", "Total Assets", "Total Liab", "Equity", "Cash", "Total Debt"])
        save_json(balance, f"ex2_balance_{ticker}.json")

    # 2d: Cash Flow Statement
    print(f"\n  Fetching cash flow for {ticker}...")
    cashflow = fmp_request("cash-flow-statement", {"symbol": ticker, "period": "annual", "limit": 5}, label=f"cashflow_{ticker}")

    if cashflow and len(cashflow) > 0:
        print_subheader(f"{ticker} — Cash Flow Highlights")
        rows = []
        for stmt in cashflow:
            cfo = stmt.get("operatingCashFlow", 0)
            capex = stmt.get("capitalExpenditure", 0)
            fcf = stmt.get("freeCashFlow", 0)
            sbc = stmt.get("stockBasedCompensation", 0)
            rows.append([
                stmt.get("calendarYear", "N/A"),
                f"${cfo / 1e9:.1f}B",
                f"${capex / 1e9:.1f}B",
                f"${fcf / 1e9:.1f}B",
                f"${sbc / 1e9:.1f}B",
                f"{fcf / cfo * 100:.0f}%" if cfo else "N/A",
            ])
        print_table(rows, ["Year", "CFO", "CapEx", "FCF", "SBC", "FCF/CFO"])
        save_json(cashflow, f"ex2_cashflow_{ticker}.json")

    # 2e: As-Reported vs Standardized comparison
    print_subheader("As-Reported vs Standardized Comparison")
    print("  Fetching as-reported income statement...")
    as_reported = fmp_request(
        "income-statement-as-reported",
        {"symbol": ticker, "period": "annual", "limit": 1},
        label=f"as_reported_{ticker}"
    )

    if as_reported and len(as_reported) > 0:
        ar = as_reported[0]
        print(f"\n  As-Reported fields available: {len(ar)} fields")
        print(f"  Sample field names (first 20):")
        for i, key in enumerate(list(ar.keys())[:20]):
            print(f"    {key}: {ar[key]}")
        save_json(as_reported, f"ex2_as_reported_{ticker}.json")
        print(f"\n  💡 TAKEAWAY: Compare the field names and values.")
        print(f"     Standardized statements normalize across companies.")
        print(f"     As-reported preserves the company's own line items.")
        print(f"     For systematic investing, standardized is usually better")
        print(f"     but you lose nuance. Acadian must deal with this constantly.")
    else:
        print("  ⚠️  As-reported endpoint may require paid plan.")

    print(f"\n  💡 KEY QUESTION: Do these numbers match what you know from")
    print(f"     your own models? Open ex2_income_{ticker}.json and verify.")


# ============================================================
# EXERCISE 3: Key Metrics & Ratios Audit
# ============================================================

def exercise_3():
    """
    Pull FMP's pre-computed ratios and verify them against
    raw financial statements. Where do they differ?
    """
    print_header(3, "Key Metrics & Ratios Audit")
    ticker = DEEP_DIVE_TICKER

    # 3a: Key Metrics
    print(f"  Fetching key metrics for {ticker}...")
    metrics = fmp_request("key-metrics", {"symbol": ticker, "period": "annual", "limit": 5}, label=f"metrics_{ticker}")

    if metrics and len(metrics) > 0:
        print_subheader(f"{ticker} — Key Metrics")
        rows = []
        for m in metrics:
            rows.append([
                m.get("calendarYear", "N/A"),
                f"{m.get('revenuePerShare', 0):.2f}",
                f"{m.get('netIncomePerShare', 0):.2f}",
                f"{m.get('operatingCashFlowPerShare', 0):.2f}",
                f"{m.get('freeCashFlowPerShare', 0):.2f}",
                f"{m.get('peRatio', 0):.1f}",
                f"{m.get('priceToSalesRatio', 0):.1f}",
                f"{m.get('debtToEquity', 0):.2f}",
                f"{m.get('returnOnEquity', 0):.2%}" if m.get('returnOnEquity') else "N/A",
            ])
        print_table(rows, ["Year", "Rev/Shr", "NI/Shr", "CFO/Shr", "FCF/Shr", "P/E", "P/S", "D/E", "ROE"])
        save_json(metrics, f"ex3_metrics_{ticker}.json")

    # 3b: Financial Ratios
    print(f"\n  Fetching financial ratios for {ticker}...")
    ratios = fmp_request("ratios", {"symbol": ticker, "period": "annual", "limit": 5}, label=f"ratios_{ticker}")

    if ratios and len(ratios) > 0:
        print_subheader(f"{ticker} — Profitability Ratios")
        rows = []
        for r in ratios:
            rows.append([
                r.get("calendarYear", "N/A"),
                f"{r.get('grossProfitMargin', 0):.1%}",
                f"{r.get('operatingProfitMargin', 0):.1%}",
                f"{r.get('netProfitMargin', 0):.1%}",
                f"{r.get('returnOnAssets', 0):.1%}",
                f"{r.get('returnOnEquity', 0):.1%}",
                f"{r.get('returnOnCapitalEmployed', 0):.1%}" if r.get('returnOnCapitalEmployed') else "N/A",
            ])
        print_table(rows, ["Year", "Gross Margin", "Op Margin", "Net Margin", "ROA", "ROE", "ROCE"])
        save_json(ratios, f"ex3_ratios_{ticker}.json")

    # 3c: Manual verification
    print_subheader("Manual Verification Exercise")
    print(f"  Now cross-check: Pull up ex2_income_{ticker}.json")
    print(f"  and ex3_ratios_{ticker}.json side by side.")
    print(f"")
    print(f"  Verify:")
    print(f"    - Gross Margin = grossProfit / revenue")
    print(f"    - Op Margin = operatingIncome / revenue")
    print(f"    - Net Margin = netIncome / revenue")
    print(f"    - Do FMP's ratios match your manual calculation?")
    print(f"    - Are there rounding differences?")
    print(f"    - How does FMP compute ROE? (NI / avg equity? NI / ending equity?)")
    print(f"")
    print(f"  💡 TAKEAWAY: If you're building systematic signals on these")
    print(f"     ratios, you need to know exactly how they're computed.")
    print(f"     Acadian computes their own — they don't use off-the-shelf scores.")


# ============================================================
# EXERCISE 4: Earnings Transcript Exploration
# ============================================================

def exercise_4():
    """
    Pull earnings transcripts. Think about what an LLM would extract.
    """
    print_header(4, "Earnings Transcript Exploration")
    ticker = DEEP_DIVE_TICKER

    # 4a: Check available transcripts
    print(f"  Checking available transcript dates for {ticker}...")
    transcript_dates = fmp_request(
        "earning-call-transcript-dates",
        {"symbol": ticker},
        label=f"transcript_dates_{ticker}"
    )

    if transcript_dates:
        print(f"\n  📊 Available transcripts for {ticker}: {len(transcript_dates)}")
        if len(transcript_dates) > 0:
            print(f"  Most recent: {transcript_dates[0]}")
            print(f"  Oldest: {transcript_dates[-1]}")

            # Show last 8 quarters
            print_subheader("Last 8 Available Transcripts")
            for t in transcript_dates[:8]:
                print(f"    Q{t.get('quarter', '?')} {t.get('year', '?')} — {t.get('date', 'N/A')}")

    # 4b: Pull one transcript
    print_subheader(f"Pulling Most Recent Transcript")
    if transcript_dates and len(transcript_dates) > 0:
        latest = transcript_dates[0]
        year = latest.get("year", 2024)
        quarter = latest.get("quarter", 4)

        transcript = fmp_request(
            "earning-call-transcript",
            {"symbol": ticker, "year": year, "quarter": quarter},
            label=f"transcript_{ticker}_Q{quarter}_{year}"
        )

        if transcript and len(transcript) > 0:
            content = transcript[0].get("content", "")
            word_count = len(content.split())
            print(f"  ✅ Got transcript: Q{quarter} {year}")
            print(f"  Word count: {word_count:,}")
            print(f"  Character count: {len(content):,}")

            # Show first 500 chars
            print_subheader("Transcript Preview (first 500 chars)")
            print(f"  {content[:500]}...")

            save_json(transcript, f"ex4_transcript_{ticker}_Q{quarter}_{year}.json")

            # 4c: Analysis prompts — things to think about
            print_subheader("LLM Feature Extraction Ideas")
            print(f"  As a fundamental analyst, what would you want an LLM to extract?")
            print(f"")
            print(f"  STRUCTURED EXTRACTION:")
            print(f"    - Revenue guidance (specific numbers vs vague language)")
            print(f"    - Margin guidance (expanding, contracting, stable)")
            print(f"    - CapEx plans and R&D commentary")
            print(f"    - Key risk factors mentioned")
            print(f"    - New product/segment commentary")
            print(f"    - Management confidence indicators")
            print(f"")
            print(f"  LINGUISTIC ANALYSIS (Acadian ENGAGER-style):")
            print(f"    - Hedging language frequency ('might', 'could', 'potentially')")
            print(f"    - Specificity score (concrete numbers vs vague qualitative)")
            print(f"    - Evasiveness detection (non-answers to analyst questions)")
            print(f"    - Referral statements ('as we mentioned last quarter...')")
            print(f"    - Sentiment shift vs prior quarter")
            print(f"")
            print(f"  CROSS-QUARTER TRACKING:")
            print(f"    - Did they deliver on last quarter's promises?")
            print(f"    - Has the narrative changed?")
            print(f"    - Topic frequency changes (more/less China talk, AI talk, etc.)")
            print(f"")
            print(f"  💡 TAKEAWAY: Read this transcript with your analyst hat on.")
            print(f"     What would you instinctively notice that a model might miss?")
            print(f"     That intuition is your competitive advantage for Acadian.")
        else:
            print(f"  ⚠️  Transcript not available (may require paid plan)")
    else:
        print(f"  ⚠️  No transcript dates returned (may require paid plan)")


# ============================================================
# EXERCISE 5: Analyst Estimates & Revisions
# ============================================================

def exercise_5():
    """
    Pull analyst estimates. Compute revision momentum.
    """
    print_header(5, "Analyst Estimates & Revisions")
    ticker = DEEP_DIVE_TICKER

    # 5a: Analyst estimates
    print(f"  Fetching analyst estimates for {ticker}...")
    estimates = fmp_request(
        "analyst-estimates",
        {"symbol": ticker, "period": "quarter", "limit": 12},
        label=f"estimates_{ticker}"
    )

    if estimates and len(estimates) > 0:
        print_subheader(f"{ticker} — Quarterly Estimates")
        rows = []
        for e in estimates:
            rows.append([
                e.get("date", "N/A"),
                f"${e.get('estimatedRevenueAvg', 0) / 1e9:.2f}B",
                f"${e.get('estimatedRevenueHigh', 0) / 1e9:.2f}B",
                f"${e.get('estimatedRevenueLow', 0) / 1e9:.2f}B",
                f"${e.get('estimatedEpsAvg', 0):.2f}",
                f"${e.get('estimatedEpsHigh', 0):.2f}",
                f"${e.get('estimatedEpsLow', 0):.2f}",
                str(e.get("numberAnalystEstimatedRevenue", "N/A")),
            ])
        print_table(rows, ["Date", "Rev Avg", "Rev High", "Rev Low", "EPS Avg", "EPS High", "EPS Low", "# Analysts"])
        save_json(estimates, f"ex5_estimates_{ticker}.json")

        # 5b: Estimate spread analysis
        print_subheader("Estimate Spread Analysis")
        for e in estimates[:4]:
            rev_avg = e.get("estimatedRevenueAvg", 0)
            rev_high = e.get("estimatedRevenueHigh", 0)
            rev_low = e.get("estimatedRevenueLow", 0)
            if rev_avg > 0:
                spread = (rev_high - rev_low) / rev_avg * 100
                print(f"  {e.get('date', 'N/A')}: Revenue spread = {spread:.1f}% of consensus")
            eps_avg = e.get("estimatedEpsAvg", 0)
            eps_high = e.get("estimatedEpsHigh", 0)
            eps_low = e.get("estimatedEpsLow", 0)
            if eps_avg > 0:
                eps_spread = (eps_high - eps_low) / eps_avg * 100
                print(f"  {e.get('date', 'N/A')}: EPS spread = {eps_spread:.1f}% of consensus")
    else:
        print(f"  ⚠️  Analyst estimates may require paid plan")

    # 5c: Earnings surprises
    print_subheader(f"{ticker} — Historical Earnings Surprises")
    # Note: earnings-surprises endpoint deprecated, trying stable first
    surprises = fmp_request(
        f"earnings-surprises",
        {"symbol": ticker},
        label=f"surprises_{ticker}"
    )

    if surprises and len(surprises) > 0:
        rows = []
        for s in surprises[:12]:
            actual = s.get("actualEarningResult", 0)
            est = s.get("estimatedEarning", 0)
            surprise_pct = ((actual - est) / abs(est) * 100) if est else 0
            rows.append([
                s.get("date", "N/A"),
                f"${actual:.2f}",
                f"${est:.2f}",
                f"{surprise_pct:+.1f}%",
                "BEAT ✅" if actual > est else "MISS ❌" if actual < est else "INLINE",
            ])
        print_table(rows, ["Date", "Actual EPS", "Estimated", "Surprise %", "Result"])
        save_json(surprises, f"ex5_surprises_{ticker}.json")

        # Quick stats
        beats = sum(1 for s in surprises if s.get("actualEarningResult", 0) > s.get("estimatedEarning", 0))
        total = len(surprises)
        print(f"\n  Beat rate: {beats}/{total} ({beats/total*100:.0f}%)")
    else:
        print(f"  ⚠️  Earnings surprises not available on free plan")

    print(f"\n  💡 TAKEAWAY: Estimate revision momentum is one of the strongest")
    print(f"     known systematic signals. Acadian uses it. The question is:")
    print(f"     can you compute it cleanly from this data? What's missing?")
    print(f"     (Hint: you have consensus snapshots, not individual analyst revisions)")


# ============================================================
# EXERCISE 6: Peer Group Construction
# ============================================================

def exercise_6():
    """
    Pull company profiles for a sector. Evaluate FMP's peer groupings.
    Think about how Acadian would build dynamic peer groups.
    """
    print_header(6, "Peer Group Construction")
    ticker = DEEP_DIVE_TICKER

    # 6a: Get stock peers from FMP (stable API)
    print(f"  Fetching FMP's suggested peers for {ticker}...")
    peers = fmp_request(
        f"stock-peers",
        {"symbol": ticker},
        label=f"peers_{ticker}"
    )

    if peers and len(peers) > 0:
        peer_symbols = [p.get("symbol") for p in peers if p.get("symbol")]
        print(f"  FMP suggests {len(peer_symbols)} peers for {ticker}:")
        print(f"  {', '.join(peer_symbols[:15])}")

        # 6b: Show peer data (already have profile-like info from peers endpoint)
        print_subheader("Peer Comparison (from peers endpoint)")
        rows = []
        for p in peers[:10]:
            mcap = p.get("mktCap", 0) / 1e9
            rows.append([
                p.get("symbol", ""),
                p.get("companyName", "")[:30],
                f"${mcap:.0f}B",
                f"${p.get('price', 0):.2f}",
            ])
        print_table(rows, ["Ticker", "Name", "Mkt Cap", "Price"])

        # 6c: Fetch full profiles for deeper comparison
        print_subheader("Full Profile Comparison")
        compare_tickers = [ticker] + peer_symbols[:4]
        profiles = []

        for t in compare_tickers:
            prof = fmp_request("profile", {"symbol": t}, label=f"peer_profile_{t}")
            if prof and len(prof) > 0:
                profiles.append(prof[0])
            time.sleep(0.3)

        if profiles:
            rows = []
            for p in profiles:
                mcap = p.get("marketCap", 0) / 1e9
                rows.append([
                    p.get("symbol", ""),
                    p.get("companyName", "")[:30],
                    f"${mcap:.0f}B",
                    p.get("sector", ""),
                    p.get("industry", "")[:30],
                    p.get("country", ""),
                ])
            print_table(rows, ["Ticker", "Name", "Mkt Cap", "Sector", "Industry", "Country"])
    else:
        print(f"  ⚠️  Stock peers endpoint may require paid plan")

    # 6d: Sector-level analysis
    print_subheader("Sector/Industry Classification Check")
    print(f"  Fetching available sectors...")
    sectors = fmp_request("available-sectors", label="sectors")
    if sectors:
        print(f"  FMP has {len(sectors)} sector categories:")
        for s in sectors[:15]:
            print(f"    - {s}")

    print(f"\n  💡 PEER GROUP QUESTIONS TO THINK ABOUT:")
    print(f"     - Would you group NVDA with AMD? With INTC? With AVGO?")
    print(f"     - Does FMP's industry classification match your mental model?")
    print(f"     - How would you build BETTER peer groups?")
    print(f"       * Business description embeddings (LLM-powered)")
    print(f"       * Revenue segment similarity")
    print(f"       * Market cap / growth rate buckets")
    print(f"       * Customer overlap analysis from transcripts")
    print(f"     - Acadian uses peer-relative metrics for EVERYTHING.")
    print(f"       Peer group quality directly impacts signal quality.")


# ============================================================
# EXERCISE 7: Price Data & Technical Context
# ============================================================

def exercise_7():
    """
    Pull price history. This is the dependent variable in any backtest.
    """
    print_header(7, "Price Data & Technical Context")
    ticker = DEEP_DIVE_TICKER

    # 7a: Historical daily prices
    print(f"  Fetching daily price history for {ticker}...")
    prices = fmp_request(
        "historical-price-eod/full",
        {"symbol": ticker},
        label=f"prices_{ticker}"
    )

    if prices and isinstance(prices, dict):
        historical = prices.get("historical", [])
        print(f"  📊 Got {len(historical)} daily price records")
        if historical:
            latest = historical[0]
            oldest = historical[-1]
            print(f"  Date range: {oldest.get('date')} to {latest.get('date')}")

            # Show recent prices
            print_subheader("Last 10 Trading Days")
            rows = []
            for p in historical[:10]:
                rows.append([
                    p.get("date"),
                    f"${p.get('open', 0):.2f}",
                    f"${p.get('high', 0):.2f}",
                    f"${p.get('low', 0):.2f}",
                    f"${p.get('close', 0):.2f}",
                    f"{p.get('volume', 0):,.0f}",
                    f"{p.get('changePercent', 0):.2f}%",
                ])
            print_table(rows, ["Date", "Open", "High", "Low", "Close", "Volume", "Change%"])

            # Quick stats
            closes = [p.get("close", 0) for p in historical[:252] if p.get("close")]
            if len(closes) > 1:
                ytd_return = (closes[0] / closes[-1] - 1) * 100
                max_price = max(closes)
                min_price = min(closes)
                print(f"\n  1Y Return: {ytd_return:.1f}%")
                print(f"  1Y Range: ${min_price:.2f} - ${max_price:.2f}")
                print(f"  Current vs 1Y High: {(closes[0] / max_price - 1) * 100:.1f}%")

            save_json(historical[:252], f"ex7_prices_{ticker}_1yr.json")

    # 7b: Quote (current)
    print_subheader("Current Quote")
    quote = fmp_request("quote", {"symbol": ticker}, label=f"quote_{ticker}")
    if quote and len(quote) > 0:
        q = quote[0]
        print(f"  {q.get('symbol')}: ${q.get('price', 0):.2f}")
        print(f"  Change: {q.get('changesPercentage', 0):.2f}%")
        print(f"  Market Cap: ${q.get('marketCap', 0) / 1e9:.1f}B")
        print(f"  P/E: {q.get('pe', 'N/A')}")
        print(f"  Avg Volume: {q.get('avgVolume', 0):,.0f}")

    print(f"\n  💡 TAKEAWAY: Price data is the dependent variable in any backtest.")
    print(f"     Check: are prices adjusted for splits and dividends?")
    print(f"     FMP says yes, but verify for a stock you know had a split.")


# ============================================================
# EXERCISE 8: News & Sentiment
# ============================================================

def exercise_8():
    """
    Pull news with sentiment. How useful is it?
    Note: News endpoints may require paid plan on current FMP API.
    """
    print_header(8, "News & Sentiment")
    ticker = DEEP_DIVE_TICKER

    # 8a: Stock news (try stable first, fallback message if unavailable)
    print(f"  Fetching recent news for {ticker}...")
    print(f"  ⚠️  Note: News endpoints may require paid plan on current FMP API.\n")

    # Try stable endpoint
    news = fmp_request(
        f"stock-news",
        {"symbol": ticker, "limit": 15},
        label=f"news_{ticker}"
    )

    if news and len(news) > 0:
        print_subheader(f"Recent {ticker} News")
        rows = []
        for n in news[:10]:
            title = n.get("title", "")[:60]
            source = n.get("site", n.get("source", ""))[:15]
            date = n.get("publishedDate", n.get("date", ""))[:10]
            sentiment = n.get("sentiment", "N/A")
            rows.append([date, source, title, sentiment])
        print_table(rows, ["Date", "Source", "Title", "Sentiment"])
        save_json(news, f"ex8_news_{ticker}.json")

        # Check sentiment distribution
        sentiments = [n.get("sentiment", "unknown") for n in news if n.get("sentiment")]
        if sentiments:
            from collections import Counter
            sent_counts = Counter(sentiments)
            print(f"\n  Sentiment distribution: {dict(sent_counts)}")
        else:
            print(f"\n  ⚠️  No sentiment scores in news data")
            print(f"      FMP may provide sentiment via a different endpoint")
    else:
        print(f"  ⚠️  News endpoint not available on free plan")
        print(f"      Consider: Yahoo Finance, Alpha Vantage, or Polygon.io for news data")

    # 8b: Press releases
    print_subheader("Press Releases")
    press = fmp_request(
        f"press-releases",
        {"symbol": ticker, "limit": 10},
        label=f"press_{ticker}"
    )

    if press and len(press) > 0:
        for p in press[:5]:
            date = p.get("date", "")[:10]
            title = p.get("title", "")[:70]
            print(f"  {date} — {title}")
        save_json(press, f"ex8_press_{ticker}.json")

    print(f"\n  💡 TAKEAWAY: Alternative data like news sentiment is what")
    print(f"     Acadian means by 'active alternative data scouting.'")
    print(f"     The question is: does this data contain alpha?")
    print(f"     You'd need to systematically test it against returns.")


# ============================================================
# SUMMARY & REQUEST TRACKING
# ============================================================

def print_summary():
    """Print summary of all API requests made."""
    print(f"\n{'='*70}")
    print(f"  SESSION SUMMARY")
    print(f"{'='*70}")
    print(f"\n  Total API requests made: {REQUEST_COUNT}")
    print(f"  Daily limit (free plan): 250")
    print(f"  Remaining (approx): {250 - REQUEST_COUNT}")
    print(f"\n  Request log:")
    for r in REQUEST_LOG:
        status_icon = "✅" if r["status"] == 200 else "⚠️" if r["status"] in (403, 429) else "❌"
        print(f"    {r['n']:3d}. {status_icon} [{r['status']}] {r['endpoint'][:50]}")

    print(f"\n  Output files saved to: {OUTPUT_DIR.absolute()}")
    print(f"\n  📁 Files created:")
    for f in sorted(OUTPUT_DIR.glob("*.json")):
        size = f.stat().st_size / 1024
        print(f"    {f.name} ({size:.1f} KB)")


# ============================================================
# MAIN
# ============================================================

EXERCISES = {
    1: ("Universe Construction", exercise_1),
    2: ("Financial Statement Deep Dive", exercise_2),
    3: ("Key Metrics & Ratios Audit", exercise_3),
    4: ("Earnings Transcript Exploration", exercise_4),
    5: ("Analyst Estimates & Revisions", exercise_5),
    6: ("Peer Group Construction", exercise_6),
    7: ("Price Data & Technical Context", exercise_7),
    8: ("News & Sentiment", exercise_8),
}


def main():
    parser = argparse.ArgumentParser(
        description="FMP API Exploration — Phase 1",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python fmp_exploration.py --exercise 1          # Run exercise 1 only
  python fmp_exploration.py --exercise 1 2 3      # Run exercises 1, 2, 3
  python fmp_exploration.py --exercise all         # Run all exercises
  python fmp_exploration.py --list                 # List all exercises
  python fmp_exploration.py --ticker AAPL          # Override deep-dive ticker

Configure:
  export FMP_API_KEY="your_key_here"
        """
    )
    parser.add_argument("--exercise", nargs="+", default=["1"],
                        help="Exercise number(s) to run, or 'all'")
    parser.add_argument("--ticker", default=None,
                        help="Override the deep-dive ticker (default: NVDA)")
    parser.add_argument("--list", action="store_true",
                        help="List all available exercises")

    args = parser.parse_args()

    if args.list:
        print("\n  Available Exercises:")
        print("  " + "-" * 50)
        for num, (name, _) in EXERCISES.items():
            print(f"    {num}. {name}")
        print()
        return

    if args.ticker:
        global DEEP_DIVE_TICKER
        DEEP_DIVE_TICKER = args.ticker.upper()

    print(f"\n  🔑 API Key: {'✅ Set' if API_KEY else '❌ NOT SET'}")
    print(f"  🎯 Deep Dive Ticker: {DEEP_DIVE_TICKER}")
    print(f"  📁 Output Directory: {OUTPUT_DIR.absolute()}")

    # Determine which exercises to run
    if "all" in args.exercise:
        to_run = list(EXERCISES.keys())
    else:
        to_run = []
        for e in args.exercise:
            try:
                num = int(e)
                if num in EXERCISES:
                    to_run.append(num)
                else:
                    print(f"  ⚠️  Unknown exercise: {num}")
            except ValueError:
                print(f"  ⚠️  Invalid exercise number: {e}")

    if not to_run:
        print("  No valid exercises to run. Use --list to see options.")
        return

    print(f"\n  Running exercises: {to_run}")
    print(f"  Estimated API calls: ~{len(to_run) * 8} (well within daily limit)")

    for num in to_run:
        name, func = EXERCISES[num]
        try:
            func()
        except KeyboardInterrupt:
            print("\n\n  Interrupted by user.")
            break
        except Exception as e:
            print(f"\n  ❌ Exercise {num} failed: {e}")
            import traceback
            traceback.print_exc()

    print_summary()


if __name__ == "__main__":
    main()