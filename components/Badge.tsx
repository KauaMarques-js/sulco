"use client";
import { useApp } from "./AppProvider";
import type { Status } from "../lib/eic/catalog";
export default function Badge({ st }: { st: Status }) {
  const { d } = useApp();
  return (
    <span className={`badge${st === "available" ? " is-ok" : ""}`}>
      {st === "available" ? d.stAvailable : st === "validation" ? d.stValidating : d.stDev}
    </span>
  );
}
