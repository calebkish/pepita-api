import { REDIRECT_QUERY_PARAM } from "./redirect-query-param";

export function createLoginWithRedirectPath(path: string): string {
  return `/login?${REDIRECT_QUERY_PARAM}=${encodeURIComponent(path)}`;
}

