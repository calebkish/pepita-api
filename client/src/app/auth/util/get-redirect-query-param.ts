import { REDIRECT_QUERY_PARAM } from "./redirect-query-param";

export function getRedirectQueryParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(REDIRECT_QUERY_PARAM);
}

