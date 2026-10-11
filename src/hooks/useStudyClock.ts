import { useEffect, useState } from "react";
import type { CardProgress } from "../domain/study";
import { nextStudyClockAt } from "../domain/study-clock";

/** Refresh at actual deadlines, and resync after browser suspension or clock changes. */
export function useStudyClock(progress?: readonly CardProgress[]) {
  const [now, setNow] = useState(Date.now);
  const deadlines = progress?.map((p) => `${p.firstPassAt ?? ""}/${p.reviewDueAt ?? ""}`).join("|");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      timer = setTimeout(refresh, Math.max(1, nextStudyClockAt(progress, current) - current));
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisible);
    refresh();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [deadlines]);
  return now;
}
