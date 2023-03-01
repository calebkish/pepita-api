import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p>
      scroll-dashboard works!
    </p>
  `,
  styles: [
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollDashboardComponent {
  // dayRequests$ = new Subject<Array<number>>();

  onTodayClick() {
    // document.getElementById('today')?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }

  ngAfterViewInit() {
    // document.getElementById('today')?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });

    // const days: (Pick<Day, 'day'> & { isToday?: boolean })[] = [
    //   {
    //     day: '2023-01-19'
    //   },
    //   {
    //     day: '2023-01-20'
    //   },
    //   {
    //     day: '2023-01-21'
    //   },
    //   {
    //     day: '2023-01-22'
    //   },
    //   {
    //     day: '2023-01-23'
    //   },
    //   {
    //     day: '2023-01-24'
    //   },
    //   {
    //     day: '2023-01-25', // TODAY
    //     isToday: true,
    //   },
    //   {
    //     day: '2023-01-26'
    //   },
    //   {
    //     day: '2023-01-27'
    //   },
    //   {
    //     day: '2023-01-28'
    //   },
    //   {
    //     day: '2023-01-29'
    //   },
    //   {
    //     day: '2023-01-30'
    //   },
    //   {
    //     day: '2023-01-31'
    //   },
    // ];
    //
    //
    // this.state.set({ days })
    // setTimeout(() => {
    //   this.state.set('days', (state) => {
    //     const newDays = [
    //       {
    //         day: '2023-01-13'
    //       },
    //       {
    //         day: '2023-01-14'
    //       },
    //       {
    //         day: '2023-01-15'
    //       },
    //       {
    //         day: '2023-01-16'
    //       },
    //       {
    //         day: '2023-01-17'
    //       },
    //       {
    //         day: '2023-01-18'
    //       },
    //       {
    //         day: '2023-01-19'
    //       },
    //     ];
    //     return newDays.concat(state.days);
    //   })
    // }, 5000);
  }


  constructor() {
    // const today = new Date().toISOString().split('T')[0];
    // this.state.connect('days', this.dayRequests$.pipe(
    //   mergeScan((requests) => {
    //     // const idk = requests.map(r => {
    //     //   if (r.direction === 'previous') {
    //     //     const offset = offsetDate()
    //     //   }
    //     // })
    //   }, forkJoin([this.dayService.get$(today)])),
    //   map(() => {
    //     return [];
    //   }),
    // ));

    // const today = new Date();

    // const lower = offsetDate(today, -7);
    // const upper = offsetDate(today, 7);
    //
    // console.log(lower, upper);

    // this.dayRequests$.next([
    //   {
    //     direction: 'previous',
    //     amount: 7,
    //   },
    //   {
    //     direction: 'next',
    //     amount: 7,
    //   },
    // ]);

    // const today = new Date();
    // const todayKey = today.toISOString().split('T')[0];
    //
    // const lower = offsetDate(today, -7);
    // const upper = offsetDate(today, 7);
    // 
    // const range = getDateRange(lower, upper);
    //
    // forkJoin(range.map(date => {
    //   const key = date.toISOString().split('T')[0];
    //   return this.dayService.get$(key);
    // }))
    //   .subscribe(console.log);
  }
}


// const getDateRange = (start: Date, end: Date) => {
//   for(var arr=[], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate()+1)) {
//       arr.push(new Date(dt));
//   }
//   return arr;
// };
//
// const isoToUtcDate = (iso: string): Date => {
//   const [year, month, day] = iso.split('-');
//
//   if (
//     !year ||
//     Number.isNaN(Number(year)) ||
//     !month ||
//     Number.isNaN(Number(month)) ||
//     !day ||
//     Number.isNaN(Number(day))
//   ) {
//     throw new Error('Failed to convert ISO timestamp to day');
//   }
//
//   return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
// };
//
// const offsetDate = (date: Date, dayOffset: number): Date => {
//   const offset = new Date(date);
//   offset.setDate(offset.getDate() + dayOffset);
//   return offset;
// };
