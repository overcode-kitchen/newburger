import { FilterSortBar } from "@/components/filter-sort-bar";
import { MenuCard } from "@/components/menu-card";
import { hasSupabaseEnv, getMenus } from "@/lib/menu-data";
import { parseBrand, parseSort } from "@/lib/newburger";

interface HomeProps {
  searchParams: Promise<{ brand?: string; sort?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const query = await searchParams;
  const selectedBrand = parseBrand(query.brand);
  const selectedSort = parseSort(query.sort);
  const menus = await getMenus(selectedBrand, selectedSort);

  return (
    <main className="mx-auto min-w-0 w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <header className="mb-10 space-y-4">
        <p className="inline-flex w-fit items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          국내 프랜차이즈 신메뉴 모음
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            뉴버거
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            신메뉴를 한곳에 모아 두었어요. 마음에 드는 메뉴를 골라 후기도
            남겨 보세요.
          </p>
        </div>
      </header>

      {!hasSupabaseEnv && (
        <div className="mb-6 rounded-2xl border border-dashed border-border bg-muted/80 p-4 text-sm text-muted-foreground">
          Supabase 환경변수가 비어있습니다. `.env.local` 값을 채운 뒤 다시
          새로고침해 주세요.
        </div>
      )}

      <FilterSortBar selectedBrand={selectedBrand} selectedSort={selectedSort} />

      <section className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {menus.map((menu) => (
          <MenuCard
            key={menu.id}
            menu={menu}
            imageFit="contain"
            cardAspect="4/5"
            imagePosition="top"
          />
        ))}
      </section>

      {menus.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border/80 bg-muted/40 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            아직 이 조건에 맞는 신메뉴가 없어요
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            다른 브랜드를 선택하거나, 나중에 다시 확인해 주세요.
          </p>
        </div>
      )}
    </main>
  );
}
