import { inject, Injectable } from "@angular/core";
import { RxState } from "@rx-angular/state";
import { tap, switchMap, map, Subject, merge, of, shareReplay } from "rxjs";
import { Day } from "../models/day";
import { dateToString } from "../util/date-to-string";
import { stringToDate } from "../util/string-to-date";
import { Wrapped } from "../util/wrap";
import { DayService } from "./day.service";

@Injectable({ providedIn: 'root' })
export class ActiveDayService extends RxState<{
    day: string,
    dayResponse: Wrapped<Day>,
}> {
  private dayService = inject(DayService);

  setDay = new Subject<{ day: string }>();

  day$ = this.select('day');
  dayResponse$ = this.select('dayResponse');

  constructor() {
    super();

    this.connect('day', merge(
      of(dateToString(new Date())),
      this.setDay.pipe(map(({ day }) => day)),
    ));

    this.connect('dayResponse', this.select('day').pipe(
      switchMap(day => this.dayService.get$(day)),
    ));

    // Prefetching
    this.hold(this.select('day').pipe(
      tap(day => {
        const dayDate = stringToDate(day);
        const dayPlusOne = (() => {
          const dayPlusOneDate = new Date(dayDate.getTime());
          dayPlusOneDate.setDate(dayDate.getDate() + 1);
          return dayPlusOneDate;
        })();
        const dayMinusOne = (() => {
          const dayMinusOneDate = new Date(dayDate.getTime());
          dayMinusOneDate.setDate(dayDate.getDate() - 1);
          return dayMinusOneDate;
        })();
        this.dayService.prefetch(dateToString(dayPlusOne));
        this.dayService.prefetch(dateToString(dayMinusOne));
      })
    ));
  }
}
