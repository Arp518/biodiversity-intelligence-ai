import re


# ============================================================
# QUICK CONVERSATIONAL RESPONSES
# ============================================================

QUICK_RESPONSES = {
    "hi": "Hi! 🌱 How can I help you today?",
    "hii": "Hi! 🌱 How can I help you today?",
    "hiii": "Hi! 🌱 How can I help you today?",
    "hello": "Hello! 🌱 How can I help you today?",
    "hey": "Hey! 🌱 How can I help you today?",
    "thanks": "You're welcome! 🌱",
    "thank you": "You're welcome! 🌱",
    "thankyou": "You're welcome! 🌱",
    "bye": "Goodbye! 🌱 Feel free to come back anytime!"
}


def get_quick_response(question: str):

    text = question.lower().strip()

    # Remove simple punctuation
    text = re.sub(r"[!?.]+$", "", text).strip()

    return QUICK_RESPONSES.get(text)


# ============================================================
# AGRICULTURE / BIODIVERSITY DOMAIN TERMS
# ============================================================

DOMAIN_KEYWORDS = {

    # Biodiversity
    "biodiversity",
    "species",
    "species diversity",
    "ecosystem",
    "habitat",
    "pollinator",
    "pollinators",
    "soil biodiversity",
    "soil organism",
    "soil organisms",

    # Soil
    "soil",
    "soil health",
    "soil quality",
    "soil carbon",
    "organic carbon",
    "soil organic carbon",
    "soc",
    "organic matter",
    "soil organic matter",
    "soil fertility",
    "soil erosion",
    "erosion",

    # Agriculture
    "farm",
    "farming",
    "farmland",
    "agriculture",
    "agricultural",
    "crop",
    "crops",
    "wheat",
    "maize",
    "corn",
    "millet",
    "sorghum",
    "groundnut",

    # Agricultural practices
    "monoculture",
    "crop rotation",
    "intercropping",
    "agroforestry",
    "cover crop",
    "cover crops",
    "conservation agriculture",
    "tillage",
    "organic agriculture",

    # Land / restoration
    "land",
    "land degradation",
    "restoration",
    "dryland",
    "semi-arid",
    "semi arid",
    "vegetation",

    # Climate / water
    "rainfall",
    "low rainfall",
    "drought",
    "water scarcity",
    "soil moisture",
    "irrigation",

    # Management
    "sustainable agriculture",
    "sustainable soil management",
    "land management"
}


# ============================================================
# ROUTE QUERY
# ============================================================

def classify_query(question: str) -> str:

    text = question.lower().strip()

    if not text:
        return "general"

    for keyword in DOMAIN_KEYWORDS:

        pattern = r"\b" + re.escape(keyword) + r"\b"

        if re.search(pattern, text):
            return "rag"

    return "general"