# 🏗️ TECHNICAL SPECIFICATION — Verdict Lab

# 1. System Overview
Verdict Lab is a distributed experimentation and evaluation system for controlled LLM behavior analysis.

Core execution flow:
```text
Test Card
   ↓
Variable Injection
   ↓
Prompt Rendering
   ↓
Model Execution
   ↓
Response Collection
   ↓
JDay Evaluation
   ↓
Experiment Persistence
   ↓
Result Visualization
```

---

# 2. High-Level Architecture
```text
[ React Frontend ]
        |
        | Direct Streaming
        v
[ AI Providers API ]
        |
        | Completed Payloads
        v
[ Backend API ]
        |
  -------------------
  |                 |
  v                 v
[ Firebase / DB ]   [ JDay Engine ]
  |                 |
  -------------------
        |
        v
[ Evaluation Results ]
```

---

# 3. Frontend Architecture
## Stack
| Layer | Technology |
| --- | --- |
| Framework | React (Vite) |
| Styling | Tailwind CSS |
| State | Zustand |
| Auth | Firebase Auth |
| Realtime | Firebase Firestore |

---

## Responsibilities
Frontend handles:
* Streaming inference
* Prompt rendering
* Experiment execution
* State management
* Result visualization
* History browsing

---

# 4. Backend Architecture
## Stack
| Component | Technology |
| --- | --- |
| API | Express (Node.js) |
| Database | Firestore |
| Storage | Firebase Storage |
| Auth | Firebase Auth |

---

## Responsibilities
Backend handles:
* Persistence
* Evaluation orchestration
* Experiment storage
* Metadata validation
* Authentication
* Audit logging

---

# 5. Model Execution Layer
## Provider Strategy
Primary provider:
* [OpenRouter](https://openrouter.ai)

Supported providers:
* [OpenAI](https://openai.com)
* [Anthropic](https://www.anthropic.com)
* [Google AI](https://ai.google.dev)

---

## Model Router Responsibilities
* Prompt dispatching
* Provider abstraction
* Response normalization
* Token tracking
* Latency tracking
* Retry handling

---

# 6. Streaming Architecture
## MVP Decision
Streaming occurs directly between:
* Frontend
* Provider API

Reason:
Avoid server-side timeout constraints.

---

## Flow
```text
Frontend
   ↓
Provider Stream
   ↓
Client receives chunks
   ↓
Client assembles response
   ↓
Completed payload sent to backend
```

---

# 7. Test Card System
# 7.1 Schema
```json
{
  "id": "uuid",
  "name": "PRD Generator Evaluation",
  "description": "Compare few-shot vs zero-shot prompting",
  "hypothesis": "Few-shot prompting improves structure quality",
  "independent_variable": "prompt",
  "model_lock": "gpt-4o",
  "input_schema": {
    "idea": "string"
  },
  "variants": [
    {
      "id": "A",
      "label": "Zero Shot",
      "prompt_template": "Generate PRD from: {idea}"
    },
    {
      "id": "B",
      "label": "Few Shot",
      "prompt_template": "Example PRD... Generate PRD from: {idea}"
    }
  ],
  "evaluation_rubric": {
    "clarity": 10,
    "structure": 10,
    "accuracy": 10
  },
  "evaluation_engine_version": "jday_v1",
  "rubric_version": "v1"
}
```

---

# 8. Database Schema
## Core Collections (Firestore)
```text
users
models
test_cards
test_card_versions
experiments
runs
evaluations
evaluation_votes
datasets
dataset_entries
```

---

## Relationships
```text
test_cards
   └── experiments
          ├── runs
          └── evaluations
```

---

# 9. JDay Evaluation Engine
# Responsibilities
* Position randomization
* Rubric scoring
* Structured verdicts
* Bias analysis
* Confidence scoring
* Majority voting

---

# Evaluation Flow
```text
Outputs A/B
   ↓
Randomization
   ↓
Judge Prompt Construction
   ↓
Evaluation Run #1
Evaluation Run #2
Evaluation Run #3
   ↓
Majority Aggregation
   ↓
Confidence Estimation
   ↓
Final Verdict
```

---

# 10. Reproducibility System
## Stored Metadata
Every run stores:
```json
{
  "model_id": "gpt-4o",
  "provider": "openrouter",
  "temperature": 0.2,
  "top_p": 1,
  "seed": 42,
  "system_prompt": "...",
  "rendered_prompt": "...",
  "timestamp": "ISO_DATE",
  "evaluation_engine_version": "jday_v1"
}
```

---

# 11. Security Model
## BYOK Strategy
User API keys:
* encrypted at rest
* never logged
* scoped per provider

Recommended:
* Firebase Secrets (Backend)
* local storage fallback

---

# 12. Performance Constraints
| Constraint | Target |
| --- | --- |
| Experiment startup | < 2 sec |
| Stream latency | minimal |
| Evaluation runtime | < 15 sec |
| DB write consistency | high |
| Concurrent runs | scalable |

---

# 13. Future Architecture Extensions
## Planned Systems
### Multi-Judge Consensus
Different evaluator models.
### Benchmark Datasets
Batch evaluation suites.
### Evaluation DSL
Programmable experiment definitions.
### CI/CD Integrations
Automated regression testing for prompts.
### Statistical Analysis Layer
* Confidence intervals
* Variance tracking
* Stability analysis
* Inter-rater reliability

---

# 14. Guiding Principles
## Scientific Orientation
Experiments must isolate variables.
## Reproducibility
Every result must be reconstructable.
## Auditability
Evaluations must be inspectable.
## Bias Awareness
Evaluation systems must account for systematic judge bias.
## Modularity
Models, prompts, and evaluators remain interchangeable.

---

# 15. Final Positioning
Verdict Lab is not a chatbot interface.
It is infrastructure for controlled intelligence evaluation.
The platform enables reproducible behavioral experimentation for reasoning systems under structured conditions.
