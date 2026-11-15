import { redirect } from "next/navigation";

export function go(path: string, notice?: string): never {
  if (!notice) redirect(path);
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("notice", notice);
  redirect(`${pathname}?${params.toString()}`);
}
