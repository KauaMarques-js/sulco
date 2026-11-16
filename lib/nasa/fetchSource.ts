import { rootCertificates } from "node:tls";
import { Agent } from "undici";
import { YR2, ROOT_YR_BY_X1 } from "./svsCertificates.ts";

const SVS_HOSTS = new Set(["svs.gsfc.nasa.gov", "svs.gsfc.nasa.gov.edgesuite.net"]);
const MISSING_CHAIN = new Set(["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"]);
let svsAgent: Agent | undefined;

/** SVS currently omits its intermediate certificates. Supply only that chain,
 * scoped to SVS, while retaining root, expiry and hostname verification. */
export async function fetchSource(url: string | URL, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    const target = new URL(url);
    const code = (error as { cause?: { code?: string } })?.cause?.code;
    if (target.protocol !== "https:" || !SVS_HOSTS.has(target.hostname) || !code || !MISSING_CHAIN.has(code) || init.signal?.aborted) throw error;
    svsAgent ??= new Agent({ connect: { ca: [...rootCertificates, YR2, ROOT_YR_BY_X1], rejectUnauthorized: true } });
    const options = { ...init, dispatcher: svsAgent };
    return fetch(url, options);
  }
}
