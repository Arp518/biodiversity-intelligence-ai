# biodiversity-intelligence-ai
AI-powered biodiversity intelligence chatbot using RAG, environmental datasets, and multi-variable reasoning to provide evidence-backed insights and recommendations.
# AI Biodiversity Intelligence Chatbot

An evidence-backed biodiversity decision-support chatbot combining Retrieval-Augmented Generation (RAG), structured environmental data, and explicit multi-variable reasoning to generate scientifically grounded, traceable recommendations.

**Core goal:** Build a reasoning-first system, not a UI-heavy chatbot. Environmental measurements, thresholds, relationships, and citations must be grounded in retrieved evidence rather than invented by the LLM.

---

## 1. Project Goals

The system will:

- understand biodiversity/environmental questions
- identify relevant environmental variables and missing information
- ask targeted clarifying questions
- retrieve scientific evidence from a curated knowledge base
- retrieve numeric/categorical facts from structured storage
- reason across at least three relevant environmental variables when sufficient data exists
- identify interactions, constraints, and trade-offs
- generate practical recommendations with supported mechanisms/timeframes
- provide traceable, verified citations
- maintain context across follow-up questions
- communicate uncertainty instead of fabricating facts

---

## 2. Design Principles

- Evidence over plausible-sounding answers
- Multi-variable reasoning over generic recommendations
- Structured retrieval for numeric facts
- Semantic retrieval for scientific literature
- **When structured facts and retrieved literature could imply different values for the same variable, the structured fact always takes precedence for the numeric value; retrieved chunks are used only for qualitative/mechanistic context, never to override a stored measurement.**
- Verified citations instead of LLM-generated references
- Backend-derived confidence instead of LLM self-confidence
- Reasoning depth over frontend complexity

---

## 3. Architecture

```
USER
  |
Streamlit
  |
FastAPI
  |
Query / Slot Extraction
  |
  +-----------------------+
  |                       |
Structured Retrieval   RAG Retrieval
SQLite / pandas         ChromaDB
  |                       |
  +----------+------------+
             |
       Evidence Bundle
   (structured facts win on numeric
    conflicts; RAG chunks supply
    mechanism/context only)
             |
    Multi-Variable Reasoning
    - sourced relationships
    - constraints
    - trade-offs
             |
          Groq LLM
             |
     Structured JSON Output
             |
   +---------+----------+
   |                    |
JSON Validation   Citation Validation
   |                    |
   +---------+----------+
             |
    Rule-Based Confidence
             |
     Final Recommendation
```

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Development | VS Code + Jupyter | Exploration, cleaning, experiments |
| Language | Python 3.11 | Main language |
| Processing | pandas / NumPy | Structured-data processing |
| Embeddings | sentence-transformers | Local semantic embeddings |
| Initial embedding model | all-MiniLM-L6-v2 | Lightweight retrieval |
| Vector DB | ChromaDB | Scientific document retrieval |
| Structured store | SQLite | Numeric/categorical environmental facts |
| Backend | FastAPI | RAG and reasoning API |
| LLM | Groq-hosted model | Fast synthesis; exact model configurable |
| Memory | Lightweight session state | Multi-turn context |
| Frontend | Streamlit | Minimal demo UI |
| Testing | pytest | Automated tests |
| CI | GitHub Actions | Tests on push/pull request |
| Version control | Git + GitHub | Collaboration/submission |
| Deployment | Hugging Face Spaces / suitable host | Live demo |

**Why no LangChain/LlamaIndex initially?**
The first version keeps retrieval and reasoning explicit in Python so the pipeline is easy to understand, test, debug, evaluate, and explain. An orchestration framework can be added later only if it solves a demonstrated need.

---

## 5. Knowledge System

### 5.1 Structured environmental data

Numeric and categorical measurements should not depend on vector similarity search.

Initial candidate variables:
- soil organic carbon (SOC)
- rainfall / water availability
- land use / vegetation cover
- biodiversity indicator such as species richness

Later variables may include soil pH, temperature, habitat fragmentation/connectivity, and tree cover.

Example:
```csv
region,soil_oc_pct,rainfall_mm,tree_cover_pct,species_count,land_use
Region_A,0.42,510,6,21,cropland
```

Cleaned data will first be handled with pandas and later loaded into SQLite.

### 5.2 Scientific RAG knowledge

Start with 3–5 authoritative documents, not a huge corpus. Expand toward ~20–40 focused sources only after retrieval quality is demonstrated.

Each chunk should retain metadata:
```json
{
  "chunk_id": "SRC01_CHUNK014",
  "source": "Document title",
  "organization": "Source organization",
  "year": 2025,
  "topic": "soil_biodiversity",
  "region": "global",
  "page": 24
}
```

Stable chunk IDs allow citations to be validated after generation.

### 5.3 Evidence / relationship layer

For v1, keep the sourced rule base small and focus on:
- soil condition ↔ biodiversity
- water/rainfall ↔ vegetation/species
- land use ↔ habitat fragmentation ↔ biodiversity

Suggested `environmental_rules.csv` fields:
```
rule_id
variable
condition
threshold
unit
related_variable
relationship
recommended_action
expected_effect
applicable_region
evidence_strength
source_id
source_page
```

Never invent thresholds. Include a numeric threshold only when a suitable source supports it for the relevant context.

---

## 6. Data Strategy

The first prototype should use:
- one small real structured dataset or curated extract
- 3–4 core environmental variables
- 3–5 authoritative documents
- a few fully sourced environmental relationships

Candidate sources for later expansion include SoilGrids/ISRIC, FAO, NASA POWER, CHIRPS, WorldClim, GBIF, ESA WorldCover, Copernicus, Global Forest Watch, IPCC, and peer-reviewed literature.

Live API integrations are stretch goals, not Phase 1 dependencies.

---

## 7. Data Cleaning

Keep raw data unchanged:
```
data/
├── raw/
└── processed/
```

Cleaning workflow:
1. inspect schema, metadata, data types, and units
2. remove true duplicates
3. standardize column names
4. normalize categorical labels
5. convert measurements to consistent units
6. validate coordinates and environmental ranges
7. inspect impossible/suspicious values
8. inspect missing values
9. avoid unjustified automatic imputation
10. preserve provenance
11. document cleaning decisions
12. save cleaned output separately

Example normalization:
```
"CROP" / "Crop Land" / "cropland" -> "cropland"
```

---

## 8. RAG Pipeline

```
Document
  -> Text extraction
  -> Cleaning
  -> Chunking
  -> Metadata + stable chunk ID
  -> sentence-transformer embeddings
  -> ChromaDB
```

At query time:
```
Question -> Query embedding -> Top-k search -> Evidence chunks + metadata + IDs
```

Retrieval must be tested before connecting the LLM. A functioning vector database is not enough; the retrieved evidence must actually be relevant.

**Retrieval quality bar:** the correct/relevant chunk must appear in the top-3 results for at least 80% of the golden evaluation questions (see Section 17) before retrieval is considered ready to connect to the LLM. This replaces purely manual eyeballing with a concrete pass/fail check.

---

## 9. Multi-Variable Reasoning

The system must explain interactions, not simply mention several metrics.

Example:
```
Low SOC -> weaker soil biological condition
Low vegetation/habitat cover -> reduced habitat availability/connectivity
Low rainfall -> water limitation -> constrains restoration choices
```

Thus a potentially useful vegetation intervention may need to change because water availability constrains what is ecologically appropriate.

The first reasoning engine will use transparent Python logic and sourced relationships rather than expecting the LLM to infer everything.

---

## 10. Evidence Bundle

Before generation, construct an evidence package:
```json
{
  "query": "...",
  "known_variables": {},
  "structured_facts": [],
  "retrieved_chunks": [],
  "applicable_rules": [],
  "constraints": [],
  "missing_variables": []
}
```

The LLM synthesizes from this package instead of answering directly from model memory.

**Conflict rule:** if a numeric value appears in both `structured_facts` and a retrieved chunk, `structured_facts` is authoritative. Retrieved chunks contribute mechanism, context, and qualitative evidence only — they never override a stored measurement.

---

## 11. Structured LLM Output

Example internal schema:
```json
{
  "recommendation": "...",
  "mechanism": "...",
  "metrics_impacted": ["soil organic carbon", "biodiversity", "water availability"],
  "interactions": [],
  "time_horizon": null,
  "trade_offs": [],
  "source_ids": ["SRC01_CHUNK014"]
}
```

The LLM does not assign the final confidence score.

---

## 12. JSON Validation and Fallback

```
LLM response
   |
Schema valid?
 /          \
YES          NO
 |            |
Continue    Retry with validation error
              |
           Still invalid?
              |
         Controlled fallback
```

Malformed LLM output must not crash the demo.

---

## 13. Citation Verification

Prompt instructions alone are insufficient. Every returned `source_id` is checked against the evidence bundle.

Example:
```
Evidence supplied:
SRC01_CHUNK014
SRC02_CHUNK008

Model returns:
SRC01_CHUNK014 -> VALID
SRC99_CHUNK001 -> INVALID
```

Unsupported citations are removed or flagged before display. A displayed citation must resolve to real metadata such as document title, organization/author, page, year, and chunk ID.

---

## 14. Confidence Scoring

Confidence is calculated by the backend, not self-reported by the LLM.

Possible factors:
- retrieval quality
- structured-variable coverage
- applicable sourced-rule coverage
- citation validity
- missing-data penalty

Conceptually:
```
High    -> strong evidence + good variable coverage + sourced relationship + valid citations
Medium  -> useful evidence but some missing variables/relationships
Limited -> important missing data or weak evidence support
```

The exact heuristic (factor weights and thresholds) will be defined and tested as an explicit task within Phase 5/6, not left implicit — it must be documented and validated against the golden evaluation set before being presented as meaningful.

---

## 15. Clarifying Questions and Memory

If important variables are missing, the chatbot asks for them instead of fabricating conditions. Known values are retained in lightweight session state so follow-up messages can reuse them.

---

## 16. User-Facing Response

Responses should expose:
- Recommendation
- Why
- Variables considered
- Mechanism / interactions
- Expected effects
- Time horizon, only when supported
- Constraints / trade-offs
- Backend-computed confidence and reason
- Verified sources

---

## 17. Evaluation-First Development

Create 5–10 core evaluation questions early, before the full chatbot exists.

Example scenario:
```
Low SOC + low rainfall + monoculture land use.
What biodiversity and soil-health intervention should be considered?
```

Expected behavior:
- considers SOC, rainfall, land use, and biodiversity
- recognizes water limitation
- retrieves appropriate evidence
- explains variable interactions
- avoids unsupported numeric claims
- uses only valid citations

These questions should be rerun after each major development phase. Later, expand to ~20–30 scenarios if time allows.

---

## 18. Evaluation Metrics

Track:
- retrieval relevance (top-3 hit rate against golden questions, target ≥80%)
- citation correctness
- claim support
- numeric faithfulness
- environmental-variable coverage
- multi-variable reasoning quality
- missing-information handling
- confidence consistency
- structured-output validity
- response latency

---

## 19. Development Roadmap

### Phase 0 — Development Setup — MUST SHIP
- GitHub repository
- VS Code
- Python 3.11 `.venv`
- Jupyter kernel
- `.gitignore` **committed first**, before any `.venv/`, `chroma_db/`, or other ignored artifacts are ever created, to avoid a follow-up cleanup commit
- `requirements.txt`
- verify notebook uses project environment

### Phase 1 — Variables + Golden Evaluation Cases — MUST SHIP
- choose 3–4 initial variables
- create 5–10 evaluation scenarios
- define expected behavior
- identify minimum required knowledge

### Phase 2 — Minimum Knowledge Prototype — MUST SHIP
- collect 3–5 authoritative documents
- obtain one small real structured dataset/extract
- document provenance
- clean data
- extract document text/metadata

### Phase 3 — RAG Retrieval — MUST SHIP
- chunk documents
- create stable IDs
- attach metadata
- generate embeddings
- store in ChromaDB
- implement top-k retrieval
- test retrieval against golden questions; require ≥80% top-3 hit rate before proceeding

### Phase 4 — Structured Retrieval — MUST SHIP
- define SQLite schema
- load cleaned facts
- preserve units/provenance
- implement structured queries
- combine structured and RAG results (structured facts win on numeric conflicts — see Section 10)

### Phase 5 — Small Reasoning Layer — MUST SHIP
- create small sourced relationship table
- implement transparent multi-variable logic
- identify constraints and missing variables
- construct evidence bundle
- draft the initial confidence-scoring heuristic (factors + weights) so it's ready to wire in during Phase 6

### Phase 6 — LLM + Validation — MUST SHIP
- integrate Groq
- keep model configurable
- require evidence-constrained JSON
- validate schema
- retry malformed output
- add controlled fallback
- validate citations
- calculate and test backend confidence against the golden evaluation set

### Phase 7 — Conversation + App — MUST SHIP
- slot extraction
- lightweight session memory
- clarifying questions
- FastAPI endpoints
- minimal Streamlit UI
- evidence/source display

### Phase 8 — Automated Tests + CI — MUST SHIP
Add pytest coverage for retrieval, reasoning, citation validation, JSON validation, and API behavior.

Add a minimal GitHub Actions workflow:
```
Push / Pull Request -> Install dependencies -> pytest -> PASS/FAIL
```

### Phase 9 — Deployment — MUST SHIP
- test from fresh environment
- verify secrets excluded
- deploy live demo
- test production behavior
- document setup and limitations

### Stretch Goals
Only after the core pipeline is stable:
- expand corpus toward 20–40 focused documents
- add more datasets
- live environmental APIs
- latitude/longitude support
- geospatial visualization
- hybrid retrieval/reranking
- richer biodiversity indicators
- larger rule layer
- 20–30+ evaluation cases
- local/offline LLM fallback

---

## 20. Repository Structure

The repository grows incrementally:
```
biodiversity-intelligence-ai/
├── .venv/                       # local only; ignored by Git
├── data/
│   ├── raw/
│   ├── processed/
│   ├── knowledge/
│   ├── rules/
│   └── evaluation/
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_data_cleaning.ipynb
│   └── 03_retrieval_experiments.ipynb
├── src/
│   ├── data/
│   ├── rag/
│   ├── reasoning/
│   ├── llm/
│   ├── validation/
│   └── memory/
├── tests/
├── .github/
│   └── workflows/
│       └── tests.yml
├── app.py
├── api.py
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

Not every folder needs to exist on Day 1.

---

## 21. Git and Security

Ignore:
```
.venv/
venv/
.env
__pycache__/
*.pyc
.ipynb_checkpoints/
chroma_db/
.DS_Store
Thumbs.db
```

Real API keys must never be committed. `.env.example` can safely contain:
```
GROQ_API_KEY=your_api_key_here
```

Large datasets should generally be referenced through reproducible source/download instructions rather than committed unnecessarily.

---

## 22. CI/CD Strategy

Initial CI is deliberately small and honest:
```
Git push / pull request
       -> GitHub Actions
       -> Install dependencies
       -> Run pytest
       -> Pass / fail
```

Deployment automation can be added later if useful for the selected host.

---

## 23. Must-Ship Definition

The project is submission-ready when it can demonstrate:
```
Question
 -> relevant variables identified
 -> structured facts retrieved
 + scientific evidence retrieved
 -> multiple variables connected
 -> evidence-backed recommendation
 -> JSON validated
 -> citations verified
 -> confidence calculated
 -> sources shown
```

A polished frontend is not part of the must-ship definition.

---

