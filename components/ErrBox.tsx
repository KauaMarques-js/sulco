import type { Dict } from "../lib/i18n";
import type { Fail } from "./AppProvider";
export default function ErrBox({ d, f, msg, retry }: { d: Dict; f: Fail; msg: string; retry: () => void }) {
  return (<div className="warn" role="alert"><p>{msg}</p>
    {f.detail && process.env.NODE_ENV !== "production" && <details><summary>{d.detail}</summary><pre style={{ whiteSpace: "pre-wrap" }}>{f.source}: {f.detail}</pre></details>}
    <button onClick={retry}>{d.retry}</button></div>);
}
