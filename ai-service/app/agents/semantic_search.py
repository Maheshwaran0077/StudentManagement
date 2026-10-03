"""
Semantic Search Agent
Converts a natural-language query into an embedding and ranks candidates
using cosine similarity.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.core.model_manager import encode_single
from app.core.schemas import SemanticSearchInput, SemanticSearchResult, SearchResultItem

TOP_K = 10


def search(data: SemanticSearchInput) -> SemanticSearchResult:
    query_embedding = np.array(encode_single(data.query)).reshape(1, -1)

    scored: list[tuple[str, float]] = []

    for candidate in data.candidates:
        if candidate.embedding:
            cand_emb = np.array(candidate.embedding).reshape(1, -1)
        else:
            # Encode text on the fly if no embedding stored
            cand_emb = np.array(encode_single(candidate.text)).reshape(1, -1)

        sim = float(cosine_similarity(query_embedding, cand_emb)[0][0])
        scored.append((candidate.id, sim))

    # Sort descending by similarity
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:TOP_K]

    results = [
        SearchResultItem(id=cid, score=round(score, 4), rank=rank + 1)
        for rank, (cid, score) in enumerate(top)
    ]

    return SemanticSearchResult(query=data.query, results=results)
