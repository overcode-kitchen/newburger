import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { designPreviewRegistry } from "@/lib/design-system-registry";

interface ComponentFileInfo {
  filePath: string;
  updatedAt: string;
}

const TOKEN_PREVIEWS = [
  { name: "background", className: "bg-background text-foreground border" },
  { name: "foreground", className: "bg-foreground text-background" },
  { name: "primary", className: "bg-primary text-primary-foreground" },
  { name: "secondary", className: "bg-secondary text-secondary-foreground" },
  { name: "muted", className: "bg-muted text-muted-foreground" },
  { name: "accent", className: "bg-accent text-accent-foreground" },
  { name: "destructive", className: "bg-destructive text-white" },
  { name: "card", className: "bg-card text-card-foreground border" },
];

async function walkComponentFiles(
  targetDir: string,
  baseDir: string,
): Promise<ComponentFileInfo[]> {
  const entries = await readdir(targetDir, { withFileTypes: true });
  const files: ComponentFileInfo[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkComponentFiles(absolutePath, baseDir);
      files.push(...nested);
      continue;
    }
    if (!entry.name.endsWith(".tsx")) continue;

    const info = await stat(absolutePath);
    files.push({
      filePath: path.relative(baseDir, absolutePath),
      updatedAt: new Date(info.mtimeMs).toLocaleString("ko-KR"),
    });
  }

  return files.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

export default async function DesignSystemPage() {
  const baseDir = process.cwd();
  const componentsDir = path.join(baseDir, "src/components");
  const componentFiles = await walkComponentFiles(componentsDir, baseDir);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">NewBurger Design System</h1>
        <p className="text-sm text-muted-foreground">
          디자인 토큰/컴포넌트 프리뷰/파일 인벤토리를 한 곳에서 확인합니다.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">토큰 프리뷰</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TOKEN_PREVIEWS.map((token) => (
            <div key={token.name} className="space-y-2">
              <div className={`h-20 rounded-lg p-3 ${token.className}`} />
              <p className="text-xs text-muted-foreground">{token.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">컴포넌트 프리뷰</h2>
        <div className="space-y-4">
          {designPreviewRegistry.map((item) => (
            <article key={item.sourcePath} className="rounded-lg border p-4">
              <div className="mb-4 space-y-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.sourcePath}</p>
                {item.notes && (
                  <p className="text-xs text-muted-foreground">{item.notes}</p>
                )}
              </div>
              <div className="rounded-md bg-muted/40 p-4">{item.render()}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">컴포넌트 인벤토리 (자동 갱신)</h2>
        <p className="text-sm text-muted-foreground">
          `src/components` 하위 `.tsx` 파일을 서버에서 스캔해 최신 수정 시각과 함께
          보여줍니다.
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">파일</th>
                <th className="px-3 py-2 font-medium">마지막 수정</th>
              </tr>
            </thead>
            <tbody>
              {componentFiles.map((file) => (
                <tr key={file.filePath} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{file.filePath}</td>
                  <td className="px-3 py-2">{file.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
