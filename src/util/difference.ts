export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _difference = new Set<T>(setA);

  for (const elem of setB) {
    if (_difference.has(elem)) {
      _difference.delete(elem);
    }
  }
  return _difference;
}
