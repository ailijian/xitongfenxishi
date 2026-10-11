import raw from "./case_paper_beginner_coaching.json";
import { content } from "../content";
import { validateCoaching } from "../../domain/coaching-schema";
export const coachingPackage=validateCoaching(raw,content);
export const caseCoaches=new Map(coachingPackage.caseWalkthroughs.map(c=>[c.caseId,c]));
export const essayCoaches=new Map(coachingPackage.essayCoaches.map(e=>[e.essayId,e]));
