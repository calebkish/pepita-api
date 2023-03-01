import fs from 'node:fs';

export class Csv<T = any> {
  rowArrs: string[][];
  headers: string[];
  rows: T[];

  constructor(path: string) {
    const text = fs.readFileSync(path, { encoding: 'utf-8' });
    this.rowArrs = text.split('\n').map(row => {
      const trimmedRow = row.replace(/^"/, '').replace(/"$/, '');
      const columns = trimmedRow.split('","').map(column => {
        return column;
      });
      return columns;
    });
    this.headers = this.rowArrs[0];
    this.rows = this.rowArrs.map((rowArr: any) => {
      const row: Record<string, string> = {};
      for (let i=0; i < this.headers.length; i++) {
        row[this.headers[i]] = rowArr[i];
      }
      return row;
    }) as T[];
  }

}
