import { existsSync, readFileSync } from "node:fs";
import { mcdonald } from "./sources/mcdonald";
import { createAdminClient, syncBrand } from "./sync";
import type { Brand, BrandSource } from "./types";

/** GitHub Actions 는 env 를 직접 주입하므로 .env.local 은 있을 때만 읽는다. 이미 있는 값은 덮지 않는다. */
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const SOURCES: ReadonlyArray<BrandSource> = [mcdonald];

async function main() {
  loadEnvFile(".env.local");

  const requested = process.argv.slice(2) as Brand[];
  const targets = requested.length > 0
    ? SOURCES.filter((s) => requested.includes(s.brand))
    : SOURCES;
  if (targets.length === 0) {
    console.error(`알 수 없는 브랜드: ${requested.join(", ")} · 가능: ${SOURCES.map((s) => s.brand).join(", ")}`);
    process.exit(2);
  }

  const db = createAdminClient();
  let failed = 0;

  for (const source of targets) {
    const startedAt = Date.now();
    try {
      const items = await source.crawl();
      const result = await syncBrand(db, source.brand, items);
      console.log(
        `[${source.brand}] ok · seen=${result.seen} new=${result.created} gone=${result.deactivated} · ${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      failed += 1;
      console.error(`[${source.brand}] FAILED · ${error instanceof Error ? error.message : error}`);
    }
  }

  // 하나라도 실패하면 non-zero 로 끝내 자동화 쪽에서 감지되게 한다
  process.exit(failed > 0 ? 1 : 0);
}

main();
