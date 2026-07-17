import { describe, it, expect } from "vitest";

// Consensus simulation function to test tally logic
export function aggregateVotes(votes: string[]): { A: number; B: number; Tie: number; winner: string; agreement: number } {
  const tally = { A: 0, B: 0, Tie: 0 };
  votes.forEach((v) => {
    tally[v as "A" | "B" | "Tie"] = (tally[v as "A" | "B" | "Tie"] || 0) + 1;
  });

  let winner = "Tie";
  if (tally.A > tally.B && tally.A > tally.Tie) winner = "A";
  else if (tally.B > tally.A && tally.B > tally.Tie) winner = "B";

  const agreement = Math.max(tally.A, tally.B, tally.Tie) / votes.length;

  return { ...tally, winner, agreement };
}

// Prompt editor regex simulation function
export function extractPlaceholders(template: string): string[] {
  const regex = /\{([a-zA-Z0-9_]+)\}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    matches.push(match[1]);
  }
  return Array.from(new Set(matches));
}

describe("JDay Consensus Engine", () => {
  it("should calculate correct winner on clear majority", () => {
    const votes = ["A", "A", "B"];
    const result = aggregateVotes(votes);
    expect(result.winner).toBe("A");
    expect(result.A).toBe(2);
    expect(result.B).toBe(1);
    expect(result.agreement).toBeCloseTo(0.667, 3);
  });

  it("should return a Tie if there is no clear majority", () => {
    const votes = ["A", "B", "Tie"];
    const result = aggregateVotes(votes);
    expect(result.winner).toBe("Tie");
    expect(result.agreement).toBeCloseTo(0.333, 3);
  });

  it("should return correct winner for perfect consensus", () => {
    const votes = ["B", "B", "B", "B"];
    const result = aggregateVotes(votes);
    expect(result.winner).toBe("B");
    expect(result.agreement).toBe(1.0);
  });
});

describe("Prompt Template Regex Engine", () => {
  it("should extract simple single variables", () => {
    const template = "Design an elevator pitch for {idea}";
    const variables = extractPlaceholders(template);
    expect(variables).toEqual(["idea"]);
  });

  it("should extract multiple distinct variables without duplication", () => {
    const template = "Context: {role}. Tasks: {task} and {task}. Constraint: {limit}.";
    const variables = extractPlaceholders(template);
    expect(variables).toEqual(["role", "task", "limit"]);
  });

  it("should return empty list when no variables exist", () => {
    const template = "This prompt template has zero variables.";
    const variables = extractPlaceholders(template);
    expect(variables).toEqual([]);
  });

  it("should ignore malformed placeholders", () => {
    const template = "This {is malformed} and {unclosed";
    const variables = extractPlaceholders(template);
    expect(variables).toEqual([]);
  });
});
