"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./AppProvider";
import { Icon, Mark } from "./Icons";
import type { Lang } from "../lib/i18n";

export default function Header() {
  const { d, lang, setLang, setA11yOpen } = useApp();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  const items: [string, string][] = [
    ["/", d.navHome],
    ["/experiences", d.navExp],
    ["/data", d.navData],
    ["/about", d.navAbout],
  ];
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="top">
      <a className="skip" href="#main">{d.skip}</a>
      <Link href="/" className="brand" aria-label="SULCO">
        <Mark />
        <span>SULCO<small>{d.brandTag}</small></span>
      </Link>
      <nav aria-label={d.navLabel} id="mainmenu" className={`menu${open ? " open" : ""}`}>
        {items.map(([h, t]) => (
          <Link key={h} href={h} className="navlink" aria-current={active(h) ? "page" : undefined}>{t}</Link>
        ))}
      </nav>
      <div className="tools">
        <div className="seg" role="group" aria-label={d.language}>
          {(["en", "pt-BR"] as Lang[]).map((l) => (
            <button key={l} lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l === "en" ? "EN" : "PT"}
            </button>
          ))}
        </div>
        <button className="a11ybtn" aria-haspopup="dialog" onClick={() => setA11yOpen(true)} aria-label={d.a11yBtn}>
          <Icon name="access" size={18} />
          <span className="lbl">{d.a11yBtn}</span>
        </button>
        <button
          className="burger icon-btn"
          aria-expanded={open}
          aria-controls="mainmenu"
          aria-label={d.menu}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
    </header>
  );
}
