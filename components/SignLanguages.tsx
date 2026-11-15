"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
const scripts = new Map<string, Promise<void>>();
function load(src: string) {
  const existing = scripts.get(src); if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script"); script.src = src; script.async = true;
    script.onload = () => resolve(); script.onerror = () => { scripts.delete(src); script.remove(); reject(new Error("Sign language script unavailable")); };
    document.body.appendChild(script);
  }); scripts.set(src, promise); return promise;
}
export default function SignLanguages({ ready }: { ready: boolean }) {
  const { lang, a11yOpen } = useApp();
  const vl = useRef<HTMLDivElement>(null), asl = useRef<HTMLDivElement>(null);
  const instances = useRef({ vl: false, asl: false });
  const [error, setError] = useState(false), [retry, setRetry] = useState(0);
  const token = process.env.NEXT_PUBLIC_HANDTALK_TOKEN;
  const portuguese = ready && lang === "pt-BR";
  const english = ready && lang === "en" && Boolean(token);
  useEffect(() => {
    // Current VLibras creates its launcher and app beside the host, in document.body.
    // Keep both inside our language boundary so they also hide in EN and in the modal.
    const adopt = () => {
      if (!vl.current) return;
      for (const id of ["vlibras-access-wrapper", "vlibras-app-root"]) {
        const root = document.getElementById(id);
        if (root && !vl.current.contains(root)) vl.current.appendChild(root);
      }
    };
    const observer = new MutationObserver(adopt);
    observer.observe(document.body, { childList: true }); adopt();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true; setError(false);
    async function start() {
      try {
        if (portuguese && !instances.current.vl) {
          await load("https://vlibras.gov.br/app/vlibras-plugin.js");
          if (!active) return;
          const w = window as unknown as { VLibras: { Widget: new (root: string) => unknown } };
          new w.VLibras.Widget("https://vlibras.gov.br/app"); instances.current.vl = true;
        }
        if (english && !instances.current.asl && asl.current) {
          await load("https://plugin.handtalk.me/web/latest/handtalk.min.js");
          if (!active || !asl.current) return;
          const w = window as unknown as { HT: new (options: object) => unknown };
          new w.HT({ token, language: "en-ase", parentElement: asl.current, doNotTrack: true, addonsMap: { navigation: { pageSpeech: false }, aiAssistant: { signTranslator: true, synonymsMeanings: false } } }); instances.current.asl = true;
        }
      } catch { if (active) setError(true); }
    }
    void start(); return () => { active = false; };
  }, [portuguese, english, token, retry]);
  return <>
    <div data-sign-language="libras" ref={vl} className="sign-host enabled" hidden={!portuguese || a11yOpen} inert={!portuguese || a11yOpen} {...({vw:"true"} as object)}><div {...({"vw-access-button":"true"} as object)} className="active" /><div {...({"vw-plugin-wrapper":"true"} as object)}><div className="vw-plugin-top-wrapper" /></div></div>
    <div data-sign-language="asl" ref={asl} className="sign-host" hidden={!english || a11yOpen} inert={!english || a11yOpen} />
    {error && <div className="sign-error" role="status"><p>{lang === "pt-BR" ? "Não foi possível carregar o tradutor de sinais. O texto e as legendas continuam disponíveis." : "The sign language translator could not load. Text and captions remain available."}</p><button onClick={() => setRetry((v) => v + 1)}>{lang === "pt-BR" ? "Tentar novamente" : "Try again"}</button></div>}
  </>;
}
