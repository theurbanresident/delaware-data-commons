const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = configuredBasePath === "/" ? "" : configuredBasePath.replace(/\/$/, "");

export function sitePath(path: string) {
  if (/^(?:[a-z]+:|#)/i.test(path)) return path;
  const rooted = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${rooted}` || "/";
}
