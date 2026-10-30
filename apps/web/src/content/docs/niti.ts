import type { NitiId } from "./types";

// The seven principles of NITI Aayog, "Responsible AI for All" (Part 1 – Principles, 2021),
// in plain words. Ids match apps/api/content/principle_map.json.
export const NITI_PRINCIPLES: Record<NitiId, { name: string; rule: string }> = {
  safety_reliability: {
    name: "Safety and Reliability",
    rule: "An AI system must work the way it is meant to, every time. There must be safeguards that stop it from harming people, and a way to raise a problem and get it fixed.",
  },
  equality: {
    name: "Equality",
    rule: "An AI system must treat people in the same situation in the same way. If it works better for some groups than others, that must be found and dealt with.",
  },
  inclusivity_non_discrimination: {
    name: "Inclusivity and Non-discrimination",
    rule: "An AI system must not shut anyone out or treat them unfairly because of who they are, such as their language, gender, age, religion or where they live. It should be usable by everyone it is meant for.",
  },
  privacy_security: {
    name: "Privacy and Security",
    rule: "Personal data must be kept safe. Only the right people may see it, only for the right reason, and only as much as is needed.",
  },
  transparency: {
    name: "Transparency",
    rule: "People must be able to understand how the AI system works and why it gave a result. Its design and behaviour must be written down so others can check it.",
  },
  accountability: {
    name: "Accountability",
    rule: "There must always be a person or team responsible for what the AI system does. Its decisions must be recorded so they can be checked and audited later.",
  },
  positive_human_values: {
    name: "Protection and Reinforcement of Positive Human Values",
    rule: "An AI system must support good human values such as care, dignity and honesty. It must not mislead people, scare them, or replace human judgement where it matters.",
  },
};

export const NITI_ORDER: NitiId[] = [
  "safety_reliability",
  "equality",
  "inclusivity_non_discrimination",
  "privacy_security",
  "transparency",
  "accountability",
  "positive_human_values",
];
