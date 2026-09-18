from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from app.rag import rag_answer, general_answer
from app.router import classify_query


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Biodiversity Intelligence AI",
    description=(
        "Evidence-grounded RAG API for agricultural biodiversity "
        "and soil-health recommendations."
    ),
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class QuestionRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=3,
        description="Agricultural biodiversity or soil-health question"
    )


class AnswerResponse(BaseModel):
    question: str
    answer: str


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Biodiversity Intelligence AI API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ============================================================
# RAG ENDPOINT
# ============================================================

@app.post("/ask")
def ask_question(request: QuestionRequest):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:

        mode = classify_query(question)

        print(f"Query mode: {mode}")

        # Scientific biodiversity/agriculture question
        if mode == "rag":

            answer = rag_answer(question)

        # Normal conversation
        else:

            answer = general_answer(question)

        return {
            "question": question,
            "mode": mode,
            "answer": answer
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )