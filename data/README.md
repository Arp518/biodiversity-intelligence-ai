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
## Phase 2 — Minimum Knowledge Prototype

### Purpose

The purpose of Phase 2 is to build a small but reliable knowledge base that
provides the scientific evidence and structured environmental information
required by the golden evaluation cases defined in Phase 1.

Instead of collecting a large amount of general biodiversity data, this phase
focuses only on knowledge required for the initial environmental variables:

1. Soil Organic Carbon (SOC)
2. Rainfall / Water Availability
3. Land Use / Vegetation Cover
4. Biodiversity Indicator

The knowledge collected in this phase will later support the RAG retrieval,
structured retrieval, and multi-variable reasoning components of the system.

### 1. Scientific Knowledge Collection

A small initial corpus of approximately 3–5 authoritative scientific
documents will be collected.

The documents should collectively provide evidence about:

- Soil organic carbon and soil/ecosystem condition
- Soil condition and biodiversity relationships
- Agricultural land use and biodiversity
- Effects of monoculture and land-use diversification
- Rainfall and water availability as ecological constraints
- Dryland and semi-arid restoration
- Biodiversity indicators
- Evidence-backed interventions such as crop diversification,
  intercropping, cover crops, agroforestry, or other appropriate
  land-management practices

The initial corpus will prioritize authoritative organizations and
peer-reviewed scientific literature.

Documents will be stored in:

`data/knowledge/`

### 2. Source Provenance

Every scientific document and dataset must have traceable provenance.

For scientific documents, the following information should be retained:

- Source ID
- Document title
- Author or organization
- Publication year
- Topic
- Original source URL
- Date accessed
- Local filename
- Notes about how the source is used

A `sources.csv` file will be maintained inside `data/knowledge/` for this
purpose.

This provenance information will later allow retrieved chunks and generated
recommendations to be traced back to their original scientific sources.

### 3. Structured Environmental Dataset

In addition to scientific documents, the prototype will use one small real
structured environmental dataset or curated extract.

The preferred dataset should contain multiple relevant environmental
measurements for the same sites or locations.

Useful fields may include:

- Location
- Latitude / longitude
- Soil Organic Carbon
- Rainfall
- Land-use or vegetation information
- Biodiversity measurement
- Biodiversity metric type
- Source / provenance information

It is not necessary for the first prototype to integrate several large global
environmental APIs.

If one dataset does not contain all four initial variables, a small number of
compatible and clearly documented sources may be combined.

### 4. Biodiversity Measurement

The structured dataset should preserve the actual biodiversity measurement
where possible rather than immediately converting biodiversity into labels
such as `low`, `medium`, or `high`.

For example:

`species_richness = 24`

`biodiversity_metric = observed species richness`

Any later classification of biodiversity into qualitative categories must
have a documented and scientifically supported basis.

### 5. Raw and Processed Data

Original datasets will be stored unchanged in:

`data/raw/`

Cleaned datasets will be stored separately in:

`data/processed/`

Raw source files must not be overwritten during cleaning.

The basic workflow is:

Raw Data  
→ Data Exploration  
→ Data Cleaning  
→ Validation  
→ Processed Data

### 6. Data Exploration and Cleaning

Structured data will first be inspected using Jupyter notebooks.

The following checks will be performed:

- Dataset shape
- Column names
- Data types
- Units
- Missing values
- Duplicate records
- Invalid or suspicious values
- Inconsistent categorical labels
- Location information
- Time period
- Biodiversity measurement definition

Cleaning may include:

- Standardizing column names
- Normalizing categorical values
- Converting data types
- Standardizing units
- Handling true duplicates
- Validating environmental values
- Handling missing values carefully
- Preserving source/provenance information

Missing scientific measurements will not be automatically filled or estimated
without a justified method.

### 7. Scientific Document Preparation

Scientific documents will be prepared for later RAG ingestion by extracting:

- Document text
- Source ID
- Title
- Organization / author
- Publication year
- Page number
- Topic metadata

Stable source and page information will be retained so that evidence can later
be cited and verified.

Chunking, embeddings, and ChromaDB indexing are NOT part of Phase 2. They will
be implemented in Phase 3.

### 8. Golden Case Knowledge Coverage

Before Phase 2 is considered complete, the collected knowledge will be checked
against the `required_knowledge` field in the Phase 1 golden evaluation cases.

The knowledge base should provide sufficient coverage for areas such as:

- SOC ↔ soil/ecosystem condition
- SOC ↔ biodiversity
- Rainfall ↔ vegetation establishment
- Rainfall ↔ restoration constraints
- Monoculture / land use ↔ biodiversity
- Land-use diversification
- Biodiversity measurement and interpretation
- Evidence-backed environmental interventions
- Environmental trade-offs and limitations

GC08 primarily evaluates out-of-scope handling and therefore does not require
the same scientific evidence coverage as the environmental cases.

### Phase 2 Completion Criteria

Phase 2 will be considered complete when:

- 3–5 authoritative scientific documents have been collected
- Source provenance has been documented
- One small real structured dataset/extract has been obtained
- Raw data has been preserved
- Structured data has been explored and cleaned
- A processed dataset has been created
- Cleaning decisions have been documented
- Scientific document text and metadata have been extracted
- Required knowledge for the golden evaluation cases has been checked

The output of Phase 2 will become the input to Phase 3, where the scientific
documents will be chunked, embedded, stored in ChromaDB, and tested for
retrieval quality.