import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "clamp(2rem,8vw,6rem) 0", maxWidth: "40rem" }}>
      <p className="eyebrow">404</p>
      <h1>Fora do sulco.</h1>
      <p className="lead">This groove does not exist. / Esse sulco não existe.</p>
      <div className="row" style={{ marginTop: "1.5rem" }}>
        <Link className="btn pri" href="/">SULCO</Link>
        <Link className="btn ghost" href="/experiences">Experiences</Link>
      </div>
    </div>
  );
}
