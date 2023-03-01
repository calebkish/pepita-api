export function dateToString(value: Date): string {
  const year = String(value.getFullYear());
  const month = String(value.getMonth() + 1);
  const date = String(value.getDate());

  const normalizedMonth = month.length < 2 ? '0' + month : month;
  const normalizedDate = date.length < 2 ? '0' + date : date;

  return `${year}-${normalizedMonth}-${normalizedDate}`;
}
