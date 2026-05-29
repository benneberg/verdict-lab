# 📄 PRD — Verdict Lab

## 1. Product Overview

### Product Name
Verdict Lab

### Internal Evaluation Engine
JDay

### Product Category
Behavioral evaluation infrastructure for AI systems.

---

# 2. Vision
Verdict Lab is a reproducible experimentation platform for evaluating LLM behavior under controlled conditions.

The platform enables users to design structured experiments, isolate independent variables, compare reasoning strategies, and evaluate outputs using reproducible, bias-aware judgment systems.

Verdict Lab transforms prompting from an ad hoc activity into a measurable experimental discipline.

---

# 3. Problem Statement
Current LLM tooling is fundamentally limited:
* Models are compared without controlled variables
* Prompt experiments are not reproducible
* Evaluation is subjective and inconsistent
* Outputs are difficult to benchmark over time
* Most tools optimize interaction rather than measurement

Users cannot reliably answer:
* Which reasoning strategy performs best for a task?
* Which model behaves best under fixed constraints?
* How do role instructions affect output quality?
* Which prompting structures generalize reliably?
* How stable are evaluation outcomes across runs?

There is currently no standardized infrastructure for controlled intelligence evaluation.

---

# 4. Product Thesis
A Test Card isolates a single independent variable in an AI experiment.

Verdict Lab enables users to:
* Define hypotheses
* Control experimental variables
* Execute reproducible model runs
* Evaluate outputs using structured rubrics
* Track behavioral performance over time

The platform functions as a behavioral laboratory for reasoning systems.

---

# 5. Target Users
## Primary Users
### AI / Prompt Engineers
Optimizing prompts, reasoning chains, and structured outputs.
### AI Researchers
Testing behavioral hypotheses across models and strategies.
### Software Architects
Evaluating models for technical workflows and system generation tasks.
### Product Teams
Benchmarking AI performance across operational use cases.

---

# 6. Core Concepts
## 6.1 Models
LLMs accessed through providers such as:
* OpenAI
* Anthropic
* Google

Examples:
* GPT
* Claude
* Gemini

---

## 6.2 Test Cards (Core Primitive)
Reusable experimental definitions containing:
* Hypothesis
* Independent variable
* Variants
* Prompt templates
* Constraints
* Evaluation rubrics
* Model configuration
* Dataset/input definitions

A Test Card represents a reproducible evaluation protocol.

---

## 6.3 JDay Engine
The evaluation and judgment layer responsible for:
* Bias-aware evaluation
* Rubric scoring
* Majority-vote consistency checks
* Position randomization
* Confidence estimation
* Structured verdict generation

---

# 7. Experimental Model
## 7.1 Independent Variables
Supported experiment variables:

| Variable Type | Description |
| --- | --- |
| model | Compare different LLMs |
| prompt | Compare prompt structures |
| role | Compare system roles/personas |
| reasoning_strategy | Compare CoT, ReAct, etc |
| parameter | Compare temperature/settings |

Only one independent variable should change per experiment.

---

## 7.2 Controlled Variables
All other conditions remain fixed:
* Input
* Rubric
* Constraints
* Evaluation engine version
* Prompt formatting
* Runtime settings

---

## 7.3 Reproducibility
Every experiment stores:
* model_id
* provider
* temperature
* top_p
* seed
* system prompt
* rendered prompt
* evaluation version
* rubric version
* timestamps

The platform prioritizes reproducibility over strict determinism.

---

# 8. Core User Experience
# 8.1 Dressing Room
Model configuration interface.
Features:
* BYOK API configuration
* Model selection
* Metadata display
* Provider configuration
* Parameter presets

---

# 8.2 Arena
Fast comparison interface.
Workflow:
1. Select Test Card
2. Select variants/models
3. Input experiment data
4. Execute run
5. View verdict

Purpose:
Rapid experimentation and iteration.

---

# 8.3 Test Lab
Primary experimentation environment.
Users create and manage Test Cards.
Capabilities:
* Hypothesis definition
* Variant configuration
* Rubric creation
* Prompt templating
* Dataset testing
* Variable isolation
* Version management

---

# 8.4 Evaluation View
Displays:
* Output A/B
* Structured scores
* Rubric breakdown
* Confidence score
* Bias flags
* Majority vote
* Historical comparisons

---

# 8.5 Experiment History
Persistent experiment tracking.
Features:
* Run history
* Comparison timelines
* Reproducibility metadata
* Version diffs
* Performance trends

---

# 9. JDay Evaluation System
## Evaluation Pipeline
1. Collect outputs
2. Normalize formatting
3. Randomize positions
4. Apply rubric
5. Run evaluation multiple times
6. Compute majority vote
7. Detect evaluation bias
8. Generate verdict

---

## Bias Mitigation
Supported:
* Position bias randomization
* Verbosity bias detection
* Style normalization
* Majority-vote smoothing

Future:
* Multi-judge consensus
* Cross-model judges
* Human calibration

---

## Example Evaluation Output
```json
{
  "winner": "A",
  "confidence": 0.87,
  "majority_vote_tally": {
    "A": 2,
    "Tie": 1
  },
  "scores": {
    "A": {
      "clarity": 9,
      "accuracy": 8
    },
    "B": {
      "clarity": 7,
      "accuracy": 9
    }
  },
  "bias_flags": [
    "verbosity_bias_low"
  ],
  "reasoning": "Variant A better satisfied structural constraints while maintaining clarity."
}
```

---

# 10. MVP Scope
## Included
* Test Card creation
* Variant experiments
* Model A/B evaluation
* JDay single-judge system
* Reproducibility metadata
* Experiment history
* Client-side streaming
* Rubric evaluation
* Position randomization

---

## Excluded
* Public leaderboards
* Multi-user collaboration
* Marketplace
* Image/video evaluation
* Autonomous agents
* Cost analytics
* Fine-tuning infrastructure

---

# 11. Success Metrics
| Metric | Goal |
| --- | --- |
| Time to first experiment | < 5 minutes |
| Repeat experiment usage | High |
| Test Cards per user | Increasing |
| Judge override rate | < 30% |
| Evaluation consistency | Stable |
| Session experiments | Increasing |

---

# 12. Non-Goals
Verdict Lab is not:
* A chatbot platform
* A prompt marketplace
* An autonomous agent framework
* A free inference provider
* A social AI app

---

# 13. Long-Term Vision
Verdict Lab evolves into:
* Standardized behavioral evaluation infrastructure
* A benchmark ecosystem for reasoning systems
* CI/CD for prompt and model evaluation
* Shared experimental protocols
* Reproducible intelligence benchmarking
* Evaluation infrastructure for future AI systems
