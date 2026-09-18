import os
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import errors

from app.retrieval import retrieve_quality_balanced_top3


# ============================================================
# PROJECT / ENVIRONMENT SETUP
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

load_dotenv(ENV_PATH)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY was not found. "
        "Make sure it exists in the project-root .env file."
    )

client = genai.Client(api_key=api_key)


# ============================================================
# BUILD SCIENTIFIC CONTEXT
# ============================================================

def build_rag_context(results):

    context_parts = []

    for i, item in enumerate(results, start=1):

        context_parts.append(
            f"""
SOURCE {i}
Source ID: {item['source_id']}
Page: {item['page_number']}
Chunk ID: {item['chunk_id']}

Evidence:
{item['text']}
""".strip()
        )

    return "\n\n".join(context_parts)


# ============================================================
# BUILD GROUNDED RAG PROMPT
# ============================================================

def build_rag_prompt(question, context):

    prompt = f"""
You are an evidence-grounded agricultural biodiversity and soil-health assistant.

Answer the user's question using ONLY the scientific evidence provided in the context below.

RULES:
1. Do not invent facts, numerical improvements, percentages, or timelines.
2. Do not make claims that are unsupported by the retrieved evidence.
3. Consider the user's stated soil organic carbon, rainfall, land use, and biodiversity conditions.
4. If important information is missing, clearly state what information is needed.
5. Give practical recommendations only when they are supported by the evidence.
6. If current conditions are already positive, do not recommend unnecessary drastic intervention.
7. Mention uncertainty when the evidence is insufficient.
8. Cite supporting evidence using [Source ID, Page X].
9. Keep the answer clear and understandable for a farmer or land manager.

10. Clearly distinguish between:
    - facts stated by the user,
    - findings reported by the scientific sources,
    - recommendations inferred from those findings.

11. Do not present a risk, threat, or condition mentioned in a source
    as if it definitely exists on the user's farm unless the user
    explicitly stated it.

12. Prefer cautious wording such as "the evidence indicates",
    "may help", "is associated with", or "is a potential risk"
    when the evidence does not establish a farm-specific fact.

13. Never claim that a specific user condition causes or is associated
    with an outcome unless the retrieved scientific context explicitly
    supports that relationship. Do not combine separate facts from the
    user and source into a new causal claim.
14. Use source citations exactly as they appear in the SCIENTIFIC CONTEXT.
    Never rename, reinterpret, correct, or guess a Source ID or page number.

15. Every scientific claim must cite only the source that directly supports
    that claim. Do not cite the user's question as a scientific source.

16. Do not include internal notes, corrections, reasoning, or comments about
    source attribution in the final answer.

17. Write the final answer directly to the farmer or land manager.
    Do not use phrases such as "the user stated", "the user's question",
    "facts stated by the user", or "the user's farm".

18. In the Assessment section, naturally summarize the provided conditions.
    Example: "Your farm is in a semi-arid region with low rainfall,
    low soil organic carbon, and monoculture wheat."

19. Do not mention the USER QUESTION as a source or citation.
    Scientific citations must come only from the retrieved scientific context.

20. Keep the final response concise and practical. Avoid repeating the same
    scientific finding across multiple sections unless necessary.

USER QUESTION:
{question}


SCIENTIFIC CONTEXT:
{context}


Provide the answer in this structure:

Assessment:
Briefly explain what the available conditions indicate.

Recommendation:
Give the most appropriate evidence-supported action or management approach.

Why:
Explain how the recommendation relates to soil health, biodiversity, rainfall,
or land use using the retrieved evidence.

Evidence:
List the sources used in the form [Source ID, Page X].

Limitations:
Mention any important missing information or uncertainty.
"""

    return prompt


# ============================================================
# END-TO-END RAG PIPELINE
# ============================================================


def general_answer(question: str) -> str:

    prompt = f"""
You are Biodiversity Intelligence AI, a friendly conversational assistant.

The user is having a general conversation rather than asking for an
evidence-grounded agricultural biodiversity recommendation.

Respond naturally, clearly and concisely.

If appropriate, mention that you can also help with questions about
agricultural biodiversity, soil health, land management and related topics.

Do not pretend that a general answer was retrieved from the scientific
knowledge base.

User message:
{question}
"""

    models = [
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.8-flash"
    ]

    last_error = None

    for model_name in models:

        try:

            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            if response.text:
                return response.text

        except errors.ServerError as e:
            last_error = e
            time.sleep(1)

        except errors.ClientError as e:
            last_error = e

    raise RuntimeError(
        "Unable to generate response. Last error: "
        + str(last_error)
    )
def rag_answer(question):

    # Validate input
    if not isinstance(question, str) or not question.strip():
        raise ValueError("Question must be a non-empty string.")

    question = question.strip()

    # --------------------------------------------------------
    # 1. Retrieve Top-3 scientific evidence
    # --------------------------------------------------------

    results = retrieve_quality_balanced_top3(question)

    if not results:
        raise RuntimeError(
            "No scientific evidence was retrieved for this question."
        )

    # --------------------------------------------------------
    # 2. Build scientific context
    # --------------------------------------------------------

    context = build_rag_context(results)

    # --------------------------------------------------------
    # 3. Build grounded prompt
    # --------------------------------------------------------

    prompt = build_rag_prompt(
        question,
        context
    )

    # --------------------------------------------------------
    # 4. Gemini model fallback order
    # --------------------------------------------------------

    models = [
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.8-flash"
    ]

    last_error = None

    # --------------------------------------------------------
    # 5. Generate answer
    # --------------------------------------------------------

    for model_name in models:

        try:

            print(f"Trying {model_name}...")

            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            if response.text:

                print(
                    f"Answer generated using "
                    f"{model_name} ✓"
                )

                return response.text

        except errors.ServerError as e:

            last_error = e

            print(
                f"{model_name} temporarily unavailable."
            )

            time.sleep(1)

        except errors.ClientError as e:

            last_error = e

            print(
                f"{model_name} unavailable for this API key."
            )

    # --------------------------------------------------------
    # 6. All models failed
    # --------------------------------------------------------

    raise RuntimeError(
        "All Gemini models failed. Last error: "
        + str(last_error)
    )


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    question = (
        "Semi-arid region, soil organic carbon 0.3%, "
        "rainfall is low, crop is monoculture wheat. "
        "What should I do to improve biodiversity "
        "and soil health?"
    )

    answer = rag_answer(question)

    print("\n" + "=" * 70)
    print("FINAL RAG ANSWER")
    print("=" * 70)

    print(answer)