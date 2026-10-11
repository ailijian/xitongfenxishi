import type { ReactNode } from "react";
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
export function Source({
  source,
}: {
  source: { sheet?: string; row?: number; section?: string };
}) {
  return (
    <p className="source">
      来源：
      {source.sheet ? `${source.sheet} · 第 ${source.row} 行` : source.section}
    </p>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="error-message">
      {message}
    </p>
  ) : null;
}
export const friendlyError = (e: unknown) =>
  e instanceof Error ? e.message : String(e);
