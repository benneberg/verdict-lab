# PURPOSE.md

## 1. Product Summary
Verdict Lab is an experimental prompt engineering workbench designed to enable pairwise prompt tests, system persona variations, and robust quantitative LLM evaluation. It utilizes multi-judge consensus panels (JDay Engine) to evaluate, average, and rank outputs against structured weighted rubrics.

## 2. Problem Statement
Prompt engineers often suffer from a lack of scientific rigor. Evaluating changes in system instructions, models, or temperature is usually done through manual, subjective inspection. This process is prone to position bias, style preferences, and verbosity bias. There is no automated framework to easily compare, version control, and dynamically test prompt variables with cross-model judge validation.

## 3. Target Audience (Confidence: High)
- **AI Developers & LLM Practitioners**: Who require systematic comparison between model variations, fine-tuning baselines, or prompt adjustments.
- **Enterprise Prompt Engineers**: Testing system personas or reasoning strategies against precise performance parameters.
- **AI Safety & Alignment Researchers**: Evaluating models on alignment, safety bias, or factual consistency using standardized experimental templates.

## 4. Value Proposition
Verdict Lab provides a high-reproducibility workbench where users can design structured "Test Cards" (protocols), execute comparative runs under identical input states, and receive a mathematically synthesized judge consensus verdict complete with detailed bias-detection flags.

## 5. Features

### Verified Features (Observed in Code)
- **PromptEditor**: Rich prompt editor with variable inserting controls and real-time validation highlights of `{curly_braces}` placeholders.
- **Dynamic Arena**: Pairing variant execution, supporting multiple judge selection (Gemini 1.5 Pro, 1.5 Flash, 1.0 Pro) and tally calculation.
- **Test Lab & Version Registry**: Save protocols, increment version histories, restore previous states, and audit changes side-by-side.
- **Global Benchmarks**: Full public model rankings, average confidence ratings, and total evaluation stats from Firestore.
- **Prompt Marketplace**: Community share register with JSON export and instant cloning features.
- **Real-Time Synchronisation**: Completed execution broadcast channels leveraging Supabase event buses.

### Inferred Features (Indirectly Mentioned / Partially Coded)
- **User Preference Dressing Room**: Basic customization panels for models and temperature.

### Future Features (Roadmap / Missing)
- ** relic multi-model panels (e.g. Claude / GPT integration) **
- ** Visual diff line highlights **
- ** Database background aggregation **
