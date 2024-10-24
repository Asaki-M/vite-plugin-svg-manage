import type { ViteHotContext } from "vite/types/hot";

export async function createHotContext(path: string): Promise<ViteHotContext> {
  const base = location.pathname.replace(/__svg-manage__\/?/, "");
  return (await import(/* @vite-ignore */`${base}@vite/client`)).createHotContext(path);
}
