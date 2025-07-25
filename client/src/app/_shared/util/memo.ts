// Use instead of a pure pipe if it makes sense
// from `https://itnext.io/its-ok-to-use-function-calls-in-angular-templates-ffdd12b0789e`

function hasDifferentArgs(prev: unknown[], next: unknown[]) {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (!Object.is(prev[i], next[i])) return true;
  }
  return false;
}

export function memo<T extends Function>(fnToMemoize: T): T {
  let prevArgs = [{}];
  let result: any;

  return function (...newArgs: any[]) {
    if (hasDifferentArgs(prevArgs, newArgs)) {
      result = fnToMemoize(...newArgs);
      prevArgs = newArgs;
    }
    return result;
  } as any;
}
