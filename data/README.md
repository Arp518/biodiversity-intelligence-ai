# Data

This directory contains the datasets, evaluation cases, scientific
knowledge sources, and evidence used by the AI Biodiversity Intelligence
Chatbot.

## Phase 1 — Variables and Golden Evaluation Cases

The purpose of Phase 1 is to define what environmental information the
chatbot should reason about and how its performance will later be evaluated.

### Initial Environmental Variables

The initial system will focus on:

1. Soil Organic Carbon (SOC)
2. Rainfall / Water Availability
3. Land Use / Vegetation Cover
4. Biodiversity Indicator

These variables were selected because they allow the system to reason about
interactions between soil condition, water availability, habitat conditions,
and biodiversity.

### Golden Evaluation Cases

The `evaluation/` directory contains predefined test scenarios that will be
used throughout development.

These cases are created before building the RAG and reasoning pipeline so
that we can:

- identify what scientific knowledge and data are required;
- test whether relevant evidence is retrieved;
- check whether multiple environmental variables are considered together;
- detect unsupported numerical claims;
- verify citations;
- compare system performance as the project improves.

The initial evaluation set will contain approximately 5–10 golden scenarios.

## Data Directory Structure

- `raw/` — original datasets kept unchanged.
- `processed/` — cleaned and standardized datasets.
- `evaluation/` — golden evaluation scenarios and expected behavior.
- `knowledge/` — scientific documents used by the RAG system.
- `rules/` — sourced environmental relationships used by the reasoning engine.

## Data Principles

- Raw data must not be overwritten.
- Data sources and provenance must be retained.
- Numeric thresholds must not be invented.
- Missing environmental values should not be automatically imputed without justification.
- Structured environmental measurements take precedence over conflicting numeric values found in retrieved literature.