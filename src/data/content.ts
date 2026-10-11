import knowledge from "./knowledge.json";
import questions from "./questions.json";
import cases from "./cases.json";
import essays from "./essays.json";
import essayGuide from "./essay-guide.json";
import sources from "./sources.json";
import plan from "./plan.json";
import manifest from "./manifest.json";
import type { Content } from "../domain/content-schema";

// Validated by data:check before every build; static content never contains user progress.
export const content = {
  contentVersion: manifest.contentVersion,
  knowledge,
  questions,
  cases,
  essays,
  essayGuide,
  sources,
  plan,
} as Content;
export { manifest };
