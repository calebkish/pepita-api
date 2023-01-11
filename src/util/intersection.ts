export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _intersection = new Set<T>();

  const setToIterateThrough = setA.size < setB.size
    ? setA
    : setB;
  const setToCheckAgainst = setA.size < setB.size
    ? setB
    : setA;

  for (const elem of setToIterateThrough) {
    if (setToCheckAgainst.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}
