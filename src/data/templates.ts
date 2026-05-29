
export interface TestCardTemplate {
  id: string;
  name: string;
  category: 'PROMPTING' | 'ARCHITECTURE' | 'EVALUATION';
  description: string;
  hypothesis: string;
  independent_variable: string;
  variants: Array<{ id: string; label: string; prompt_template: string }>;
  evaluation_rubric: Record<string, { max: number; weight: number }>;
  input_schema: Record<string, any>;
}

export const TEMPLATES: TestCardTemplate[] = [
  {
    id: 'few-shot-vs-zero',
    name: 'Contextual Accuracy (Few-Shot vs Zero)',
    category: 'PROMPTING',
    description: 'Evaluate if providing examples (Few-Shot) improves extraction quality over single instructions.',
    hypothesis: 'Few-shot prompting will significantly reduce hallucinations in structured data extraction tasks.',
    independent_variable: 'prompt_engineering',
    variants: [
      { 
        id: 'A', 
        label: 'Zero-Shot', 
        prompt_template: 'Extract entities from the following text: {text}. Respond strictly in JSON.' 
      },
      { 
        id: 'B', 
        label: 'Three-Shot', 
        prompt_template: 'Example 1: [Text] -> [JSON]\nExample 2: [Text] -> [JSON]\nExample 3: [Text] -> [JSON]\nNow extract from: {text}' 
      }
    ],
    evaluation_rubric: {
      'consistency': { max: 10, weight: 1.5 },
      'accuracy': { max: 10, weight: 2.0 },
      'format_adherence': { max: 10, weight: 1.0 }
    },
    input_schema: { 'text': 'string' }
  },
  {
    id: 'persona-impact',
    name: 'Tone Analysis (Role Play)',
    category: 'PROMPTING',
    description: 'Test how different system personas impact the empathy and clarity of support responses.',
    hypothesis: 'An empathetic persona will result in higher user satisfaction scores but may increase verbosity.',
    independent_variable: 'system_instruction',
    variants: [
      { 
        id: 'A', 
        label: 'Neutral Assistant', 
        prompt_template: 'You are a helpful assistant. Answer the customer query: {query}' 
      },
      { 
        id: 'B', 
        label: 'Empathetic Expert', 
        prompt_template: 'You are a senior support lead known for deep empathy and clear technical guidance. Answer: {query}' 
      }
    ],
    evaluation_rubric: {
      'empathy': { max: 10, weight: 2.0 },
      'clarity': { max: 10, weight: 1.0 },
      'conciseness': { max: 10, weight: 0.5 }
    },
    input_schema: { 'query': 'string' }
  },
  {
    id: 'cot-reasoning',
    name: 'Logic Benchmarking (CoT)',
    category: 'ARCHITECTURE',
    description: 'Compare standard output against Chain-of-Thought reasoning for complex logic problems.',
    hypothesis: 'Explicit Chain-of-Thought will improve success rates on multi-step reasoning by at least 20%.',
    independent_variable: 'reasoning_pathway',
    variants: [
      { 
        id: 'A', 
        label: 'Direct Answer', 
        prompt_template: 'Solve this problem and provide only the final result: {problem}' 
      },
      { 
        id: 'B', 
        label: 'Chain-of-Thought', 
        prompt_template: 'Let\'s think step-by-step. Solve the following problem: {problem}' 
      }
    ],
    evaluation_rubric: {
      'logical_soundness': { max: 10, weight: 2.5 },
      'mathematical_accuracy': { max: 10, weight: 2.0 }
    },
    input_schema: { 'problem': 'string' }
  },
  {
    id: 'model-benchmark',
    name: 'Multi-Model Benchmark',
    category: 'ARCHITECTURE',
    description: 'Set up a rubric specifically designed to compare performance across different model providers.',
    hypothesis: 'Premium models will exhibit 30% fewer logical fallacies than lightweight models on reasoning-heavy prompts.',
    independent_variable: 'model_architecture',
    variants: [
      { 
        id: 'A', 
        label: 'Control Variant', 
        prompt_template: 'Task: {task}' 
      }
    ],
    evaluation_rubric: {
      'hallucination_index': { max: 5, weight: 3.0 },
      'logical_deduction': { max: 10, weight: 1.5 },
      'response_latency_subjective': { max: 5, weight: 0.5 }
    },
    input_schema: { 'task': 'string' }
  }
];
