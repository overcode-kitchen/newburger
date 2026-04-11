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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">뉴버거</h1>
        <p className="text-sm text-muted-foreground">
          국내 햄버거 신메뉴를 한눈에 보고, 후기를 남겨보세요.
        </p>
      </header>

      {!hasSupabaseEnv && (
        <div className="mb-6 rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
          Supabase 환경변수가 비어있습니다. `.env.local` 값을 채운 뒤 다시
          새로고침해 주세요.
        </div>
      )}

      <FilterSortBar selectedBrand={selectedBrand} selectedSort={selectedSort} />

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {menus.map((menu) => (
          <MenuCard key={menu.id} menu={menu} />
        ))}
      </section>

      {menus.length === 0 && (
        <p className="mt-10 rounded-lg border p-6 text-center text-sm text-muted-foreground">
          조건에 맞는 신메뉴가 없습니다.
        </p>
      )}
    </main>
  );
}
