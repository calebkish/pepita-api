export function stringToDate(value: string): Date {
  const [year, month, date] = value.split('-');
  const normalizedMonth = (Number(month) - 1) % 12;
  return new Date(Number(year), normalizedMonth, Number(date));
}
