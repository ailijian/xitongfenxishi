import raw from "./day1_beginner_lessons.json";
import { content } from "../content";
import { validateBeginnerPackage } from "../../domain/lesson-schema";
import diagrams from "./diagrams.json";

export const beginnerPackage = validateBeginnerPackage(raw, content.knowledge);
export const beginnerLessons = new Map(beginnerPackage.lessons.map((l) => [l.cardId, l]));
export const lessonDiagrams = diagrams;
