from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHROMA_PATH = PROJECT_ROOT / "chroma_db"

COLLECTION_NAME = "biodiversity_knowledge_clean"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# ============================================================
# LOAD EMBEDDING MODEL + EXISTING CHROMADB
# ============================================================

embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

chroma_client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)

# IMPORTANT:
# We load the collection that was already built and validated
# in the notebook. We do NOT recreate or re-embed it here.
collection = chroma_client.get_collection(
    name=COLLECTION_NAME
)


# ============================================================
# QUERY DECOMPOSITION
# Final intended notebook version (cell 115)
# ============================================================

def decompose_query(question):
    q = question.lower()

    queries = {
        "original": question
    }

    # SOC
    if (
        "soil carbon" in q
        or "soil organic carbon" in q
        or "soc" in q
    ):

        if (
            "very low" in q
            or "low soil" in q
            or "0.3%" in q
            or "0.4%" in q
        ):
            queries["soc"] = (
                question
                + " Effects of low soil organic carbon on soil health, "
                "soil biodiversity, soil organisms and ecosystem functioning."
            )

        elif (
            "good soil carbon" in q
            or "high soil carbon" in q
        ):
            queries["soc"] = (
                question
                + " Healthy soil organic carbon, soil biodiversity, "
                "soil ecosystem stability and maintenance."
            )

        else:
            queries["soc"] = (
                question
                + " Relationship between soil organic carbon, "
                "soil biodiversity and soil health."
            )

    # RAINFALL
    if (
        "rainfall" in q
        or "semi-arid" in q
        or "semi arid" in q
    ):

        if (
            "low rainfall" in q
            or "rainfall is low" in q
            or "semi-arid" in q
            or "semi arid" in q
        ):
            queries["rainfall"] = (
                question
                + " Low rainfall semi-arid dryland restoration, "
                "water limitation, soil water availability and "
                "vegetation establishment."
            )

        elif (
            "high rainfall" in q
            or "rainfall here is high" in q
        ):
            queries["rainfall"] = (
                question
                + " High rainfall non-water-limited agricultural soil "
                "restoration, vegetation and management practices."
            )

        else:
            queries["rainfall"] = (
                question
                + " Adequate rainfall and water availability for "
                "agricultural soil restoration and vegetation establishment."
            )

    # LAND USE / MANAGEMENT
    if (
        "wheat" in q
        or "corn" in q
        or "maize" in q
        or "monoculture" in q
        or "agroforestry" in q
    ):

        if "wheat" in q and "monoculture" in q:
            queries["land_use"] = (
                question
                + " Wheat monoculture agricultural management interventions: "
                "crop diversification, crop rotation, intercropping, "
                "agroforestry, organic amendments, reduced tillage, "
                "cover crops and practices that improve soil biodiversity "
                "and soil organic carbon."
            )

        elif (
            ("corn" in q or "maize" in q)
            and "monoculture" in q
        ):
            queries["land_use"] = (
                question
                + " Corn maize monoculture agricultural management interventions: "
                "crop diversification, crop rotation, intercropping, "
                "cover crops, organic amendments, reduced tillage and "
                "practices that improve soil biodiversity and "
                "soil organic carbon."
            )

        elif "agroforestry" in q:
            queries["land_use"] = (
                question
                + " Existing agroforestry systems, biodiversity, soil health, "
                "ecosystem services and sustainable maintenance."
            )

        else:
            queries["land_use"] = (
                question
                + " Agricultural land-use diversification, crop rotation, "
                "intercropping, agroforestry and sustainable soil management."
            )

    # BIODIVERSITY
    if (
        "biodiversity" in q
        or "species" in q
        or "species count" in q
        or "species diversity" in q
    ):

        if (
            "low species" in q
            or "declining" in q
        ):
            queries["biodiversity"] = (
                question
                + " Evidence-based agricultural management practices that "
                "increase or restore biodiversity, including crop diversification, "
                "intercropping, crop rotation, agroforestry, organic amendments, "
                "reduced tillage and habitat diversification."
            )

        elif (
            "high species" in q
            or "fine for now" in q
            or "stable" in q
        ):
            queries["biodiversity"] = (
                question
                + " Evidence-based agricultural management practices that "
                "maintain existing biodiversity and ecosystem stability, "
                "including crop diversification, intercropping, crop rotation, "
                "agroforestry, organic amendments, reduced tillage and "
                "habitat diversification."
            )

        else:
            queries["biodiversity"] = (
                question
                + " Evidence-based agricultural management practices that "
                "increase or maintain biodiversity, including crop diversification, "
                "intercropping, crop rotation, agroforestry, organic amendments, "
                "reduced tillage and habitat diversification."
            )

    return queries


# ============================================================
# EVIDENCE QUALITY PENALTY
# ============================================================

def evidence_quality_penalty(text):
    """
    Lower = better.

    Penalizes chunks that may be semantically similar but are
    structurally weaker scientific evidence.
    """

    t = text.lower().strip()
    penalty = 0.0

    survey_patterns = [
        "survey question",
        "countries that replied",
        "please select",
        "please provide additional information",
        "what are the major practices in this country",
        "country responses to the soil biodiversity survey"
    ]

    if any(pattern in t for pattern in survey_patterns):
        penalty += 0.12

    toc_patterns = [
        "table of contents",
        "chapter 1",
        "chapter 2",
        "chapter 3",
        "chapter 4",
        "chapter 5",
        "chapter 6",
        "chapter 7",
        "annex i"
    ]

    if any(pattern in t for pattern in toc_patterns):
        penalty += 0.10

    if (
        ("figure " in t or "table " in t)
        and len(t.split()) < 180
    ):
        penalty += 0.035

    question_count = text.count("?")

    if question_count >= 2:
        penalty += 0.08
    elif question_count == 1:
        penalty += 0.025

    return penalty


# ============================================================
# MULTI-ASPECT CANDIDATE RETRIEVAL
# ============================================================

def retrieve_candidates(question, per_aspect=10):

    queries = decompose_query(question)
    candidates = {}

    for aspect, query in queries.items():

        query_embedding = embedding_model.encode(
            query,
            normalize_embeddings=True
        ).tolist()

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=per_aspect,
            include=["documents", "metadatas", "distances"]
        )

        for i, chunk_id in enumerate(results["ids"][0]):

            text = results["documents"][0][i]
            metadata = results["metadatas"][0][i]
            distance = results["distances"][0][i]

            if chunk_id not in candidates:
                candidates[chunk_id] = {
                    "chunk_id": chunk_id,
                    "text": text,
                    "source_id": metadata["source_id"],
                    "page_number": metadata["page_number"],
                    "distances": {},
                    "matched_aspects": []
                }

            candidates[chunk_id]["distances"][aspect] = distance
            candidates[chunk_id]["matched_aspects"].append(aspect)

    return candidates


# ============================================================
# QUALITY-AWARE RERANKING
# ============================================================

def rerank_candidates(question, per_aspect=10):

    candidates = retrieve_candidates(
        question,
        per_aspect=per_aspect
    )

    reranked = []

    for item in candidates.values():

        best_distance = min(item["distances"].values())

        penalty = evidence_quality_penalty(
            item["text"]
        )

        final_score = best_distance + penalty

        # Copy so callers don't unexpectedly mutate candidate state.
        ranked_item = item.copy()
        ranked_item["best_distance"] = best_distance
        ranked_item["quality_penalty"] = penalty
        ranked_item["final_score"] = final_score

        reranked.append(ranked_item)

    reranked.sort(
        key=lambda x: x["final_score"]
    )

    return reranked


# ============================================================
# FINAL BALANCED TOP-3 RETRIEVAL
# ============================================================

def retrieve_quality_balanced_top3(question):

    candidates = rerank_candidates(
        question,
        per_aspect=10
    )

    selected = []
    selected_ids = set()

    # 1. Rainfall
    rainfall_candidates = [
        item for item in candidates
        if "rainfall" in item["matched_aspects"]
    ]

    if rainfall_candidates:
        item = rainfall_candidates[0].copy()
        item["selected_for"] = "rainfall"

        selected.append(item)
        selected_ids.add(item["chunk_id"])

    # 2. SOC
    soc_candidates = [
        item for item in candidates
        if (
            "soc" in item["matched_aspects"]
            and item["chunk_id"] not in selected_ids
        )
    ]

    if soc_candidates:
        item = soc_candidates[0].copy()
        item["selected_for"] = "soc"

        selected.append(item)
        selected_ids.add(item["chunk_id"])

    # 3. Land use / biodiversity
    management_candidates = [
        item for item in candidates
        if (
            (
                "land_use" in item["matched_aspects"]
                or "biodiversity" in item["matched_aspects"]
            )
            and item["chunk_id"] not in selected_ids
        )
    ]

    if management_candidates:
        item = management_candidates[0].copy()
        item["selected_for"] = "management/biodiversity"

        selected.append(item)
        selected_ids.add(item["chunk_id"])

    # Fill remaining slots if fewer than 3 were selected.
    for item in candidates:

        if len(selected) >= 3:
            break

        if item["chunk_id"] not in selected_ids:
            new_item = item.copy()
            new_item["selected_for"] = "general"

            selected.append(new_item)
            selected_ids.add(item["chunk_id"])

    return selected[:3]


# ============================================================
# SIMPLE HEALTH CHECK
# ============================================================

def retrieval_status():
    return {
        "embedding_model": EMBEDDING_MODEL_NAME,
        "collection_name": COLLECTION_NAME,
        "chroma_path": str(CHROMA_PATH),
        "stored_chunks": collection.count()
    }


if __name__ == "__main__":
    print("Retrieval system loaded successfully.")
    print(retrieval_status())

    test_question = (
        "Semi-arid region, soil organic carbon 0.3%, rainfall is low, "
        "crop is monoculture wheat. What should I do to improve "
        "biodiversity and soil health?"
    )

    print("\nTEST QUESTION:")
    print(test_question)

    results = retrieve_quality_balanced_top3(test_question)

    print("\nTOP-3 RESULTS:")
    for rank, item in enumerate(results, start=1):
        print(
            rank,
            item["selected_for"],
            item["chunk_id"],
            item["source_id"],
            item["page_number"],
            round(item["final_score"], 4)
        )
