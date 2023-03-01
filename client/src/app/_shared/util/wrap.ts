import { Observable, pipe, UnaryFunction, map, catchError, of, startWith } from "rxjs";

export function wrap<T, E = any>(mapError?: (error: any) => E): UnaryFunction<Observable<T>, Observable<Wrapped<T>>> {
  return pipe(
    map(response => ({ data: response, loading: false })),
    catchError(error => of({
      error: mapError ? mapError(error) : error,
      loading: false,
    })),
    startWith({ loading: true }),
  );
}

export interface Wrapped<T> {
  loading: boolean;
  data?: T;
  error?: any;
}

