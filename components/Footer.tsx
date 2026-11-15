"use client";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { Icon, Mark } from "./Icons";

export default function Footer() {
  const { d } = useApp();
  return (
    <footer className="foot">
      <div className="foot-in">
        <div>
          <Link href="/" className="brand" aria-label="SULCO">
            <Mark size={26} />
            <span>SULCO</span>
          </Link>
          <p>{d.footPitch}</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: ".68rem", letterSpacing: ".04em", color: "var(--mut-2)" }}>
            {d.nasaChallenge}
          </p>
        </div>
        <div>
          <h4>{d.footExplore}</h4>
          <ul>
            <li><Link href="/experiences/climate">{d.expTitles.climate}</Link></li>
            <li><Link href="/experiences/fires">{d.expTitles.wildfires}</Link></li>
            <li><Link href="/data">{d.navData}</Link></li>
            <li><Link href="/discover">{d.navDiscover}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{d.sources}</h4>
          <ul>
            <li><a href="https://data.giss.nasa.gov/gistemp/" target="_blank" rel="noopener">NASA GISS · GISTEMP v4 <Icon name="external" size={12} style={{ display: "inline", verticalAlign: "-1px" }} /></a></li>
            <li><a href="https://svs.gsfc.nasa.gov/" target="_blank" rel="noopener">NASA SVS <Icon name="external" size={12} style={{ display: "inline", verticalAlign: "-1px" }} /></a></li>
            <li><a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener">NASA FIRMS <Icon name="external" size={12} style={{ display: "inline", verticalAlign: "-1px" }} /></a></li>
            <li><Link href="/about">{d.navAbout}</Link></li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        {d.madeBy} · {d.aboutDisclaimer}
      </div>
    </footer>
  );
}
