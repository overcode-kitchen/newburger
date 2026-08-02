import { existsSync, readFileSync } from "node:fs";
import { burgerking } from "./sources/burgerking";
import { lotteria } from "./sources/lotteria";
import { mcdonald } from "./sources/mcdonald";
import { momstouch } from "./sources/momstouch";
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

const SOURCES: ReadonlyArray<BrandSource> = [mcdonald, burgerking, lotteria, momstouch];

async function main() {
  loadEnvFile(".env.local");

  const requested = process.argv.slice(2) as Brand[];
  if (requested.length > 0 && requested.some((b) => !SOURCES.some((s) => s.brand === b))) {
    console.error(`알 수 없는 브랜드: ${requested.join(", ")} · 가능: ${SOURCES.map((s) => s.brand).join(", ")}`);
    process.exit(2);
  }

  // GitHub 이 러너에 자동으로 넣는 변수. 여기서는 해외 IP 차단 사이트를 건너뛴다. 이름을 지정하면 예외.
  const onHostedRunner = process.env.GITHUB_ACTIONS === "true";
  const targets = SOURCES.filter((s) => {
    if (requested.length > 0) return requested.includes(s.brand);
    if (onHostedRunner && s.localOnly) {
      console.log(`[${s.brand}] skipped · 해외 IP 차단 사이트 — 로컬에서 \`pnpm crawl ${s.brand}\` 로 실행`);
      return false;
    }
    return true;
  });

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
