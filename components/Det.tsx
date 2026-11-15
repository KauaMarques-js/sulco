"use client";
import type { ReactNode } from "react";
import { useApp } from "./AppProvider";
/** <details> que abre sozinho quando a preferência "explicações detalhadas" está ligada. */
export default function Det({ summary, children }: { summary: string; children: ReactNode }) {
  const { prefs } = useApp();
  return <details key={String(prefs.detailed)} open={prefs.detailed}><summary>{summary}</summary>{children}</details>;
}
