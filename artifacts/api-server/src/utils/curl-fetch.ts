import { spawn } from "node:child_process";

/**
 * Fetch via curl subprocess.
 * Some CDNs (e.g. GoodStream) use TLS/UA fingerprinting that blocks Node.js fetch
 * but allows plain curl. Using this for both embed-page fetch AND segment proxy
 * ensures the token fingerprint is consistent end-to-end.
 */
export function curlFetch(
  url: string,
  timeoutMs: number,
  extraArgs: string[] = [],
): Promise<{ status: number; body: Buffer; ct: string }> {
  return new Promise((resolve, reject) => {
    const args = [
      "-s",
      "-L",
      "--max-time", String(Math.ceil(timeoutMs / 1000)),
      "--write-out", "\n__STATUS__%{http_code}__CT__%{content_type}__",
      ...extraArgs,
      url,
    ];
    const proc = spawn("curl", args);
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.stderr.resume();
    proc.on("close", (code) => {
      if (code !== 0) { reject(new Error(`curl exit ${code}`)); return; }
      const full = Buffer.concat(chunks);
      const tail = full.slice(-200).toString();
      const m = tail.match(/__STATUS__(\d+)__CT__([^_]*)__/);
      if (!m) { reject(new Error("curl: unexpected output format")); return; }
      const status = parseInt(m[1]);
      const ct = m[2].split(";")[0].trim();
      const metaIdx = full.lastIndexOf(Buffer.from("\n__STATUS__"));
      const body = metaIdx >= 0 ? full.slice(0, metaIdx) : full;
      resolve({ status, body, ct });
    });
    proc.on("error", reject);
  });
}

/** Hosts that require curl instead of Node.js fetch */
export const CURL_HOSTS = /\.goodstream\.one$|^goodstream\.one$/i;
