# csuite-intelligence
Forward-looking executive decision intelligence platform. Built with Next.js 14, TypeScript, DuckDB-Wasm, ONNX Runtime Web, and Tailwind CSS. Runs fully in-browser with zero server-side storage.



# C-Suite Intelligence Platform

A production-grade, forward-looking executive decision intelligence platform designed to bridge internal ERP transactional data with macroeconomic indicators and predictive machine learning. 

All heavy analytics—including SQL querying, feature engineering, and inference—run **entirely in the browser** via DuckDB-Wasm and ONNX Runtime Web.

## 🚀 Key Features

* **CFO Overview & Signal Tiling:** Real-time health signals covering cash runways, covenant risk (DSCR), and gross margin compression.
* **In-Browser Analytical Pipeline:** Validates and ingests large ERP datasets (`orders`, `ar_aging`, `ap`, `payroll`) through Zod schemas directly into an in-memory DuckDB instance.
* **Macro Intelligence:** Integrates live public datasets (Bank of Canada Valet API, Statistics Canada WDS API, and TSX sector ETFs) to dynamically classify economic cycle phases and market risk stances.
* **Predictive & Prescriptive Views:** Combines XGBoost forecasting with actionable prescriptive banners to guide C-suite decision-making.

## 🛠 Tech Stack

* **Framework:** Next.js 14 (App Router) + TypeScript
* **Styling:** Tailwind CSS (Custom Dark Navy Theme + JetBrains Mono metrics)
* **Analytics & DB:** DuckDB-Wasm, Arquero
* **Machine Learning:** ONNX Runtime Web (`onnxruntime-web`)
* **Data Validation:** Zod
* **Visualization:** Recharts, Lucide Icons

## 📂 Project Structure

```text
src/
├── app/                  # Next.js App Router pages (CFO, Cash, Macro, Simulator)
├── components/
│   ├── layout/           # Responsive desktop sidebar & mobile navigation bar
│   └── ui/               # Reusable design system components (KPICard, InsightBanner)
├── data/
│   ├── erp/              # Synthetic transactional data (orders, AR, AP, payroll)
│   └── macro/            # Macroeconomic feeds (BoC, StatCan, TSX sector ETFs)
└── lib/
    ├── db/               # DuckDB-Wasm singleton init and ERP data loader hook
    └── schema/           # Zod data validation schemas
