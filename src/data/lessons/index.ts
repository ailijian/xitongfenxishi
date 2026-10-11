import raw from "./day1_beginner_lessons.json";
import expandedRaw from "./day2_day5_beginner_lessons.json";
import { content } from "../content";
import { validateBeginnerPackage, validateExpandedPackage } from "../../domain/lesson-schema";
import diagrams from "./diagrams.json";
import expandedDiagrams from "./expanded-diagrams.json";

export const teachingContentVersion = "2026.10.11.beginner.2";
export const integratedCourseDays = [1, 2, 3];
export const beginnerPackage = validateBeginnerPackage(raw, content.knowledge);
export const expandedPackage = validateExpandedPackage(expandedRaw, content.knowledge, content.plan);
export const courseCardIds = content.plan.filter((d) => integratedCourseDays.includes(d.day)).flatMap((d) => d.knowledgeIds);
export const beginnerLessons = new Map([...beginnerPackage.lessons, ...expandedPackage.lessons]
  .filter((l) => courseCardIds.includes(l.cardId)).map((l) => [l.cardId, l]));
export const lessonDiagrams: Record<string, {src:string;alt:string;sourceSha256:string;svgSha256:string}> = {...diagrams, ...expandedDiagrams};
