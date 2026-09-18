import { JarButton } from "@/components/jar-button";
import { getClientId } from "@/lib/client-id";
import { getMyJar } from "@/lib/records";

/** 서버에서 내 병을 읽어 헤더 버튼에 넘긴다. 페이지마다 <SiteHeader right={<HeaderJar />} /> */
export async function HeaderJar() {
  const stickers = await getMyJar(await getClientId());
  return <JarButton stickers={stickers} />;
}
