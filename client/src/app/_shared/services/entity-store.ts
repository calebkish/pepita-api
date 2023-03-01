import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { mergeMap, tap, map, catchError, Observable, of, scan, Subject, switchMap, startWith, shareReplay, take, EMPTY, distinctUntilKeyChanged, ignoreElements } from "rxjs";
import { Day } from "../models/day";
import { wrap, Wrapped } from "../util/wrap";
import { EnvironmentService } from "./environment.service";

@Injectable()
export class EntityStore {
  private readonly client = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  private setEntityAction = new Subject<{ entityKey: string; entity: Wrapped<Day> }>();

  private entities$ = this.setEntityAction.pipe(
    scan((acc, { entityKey, entity }) => {
      return { ...acc, [entityKey]: entity };
    }, {} as Record<string, Wrapped<Day>>),
    startWith({} as Record<string, Wrapped<Day>>),
    shareReplay(1),
  );

  constructor() {
    this.entities$.subscribe();
  }

  // client-side state
  get$(entityKey: string): Observable<Wrapped<Day>> {
    return this.entities$.pipe(
      distinctUntilKeyChanged(entityKey),
      mergeMap(entities => {
        const cached = entities[entityKey];
        if (cached) {
          return of(cached);
        }

        return this.client.get<Day>(`${this.env.apiHost}/day/${entityKey}`).pipe(
          wrap(),
          tap((entityResponse) => {
            this.setEntityAction.next({ entityKey: entityKey, entity: entityResponse });
          }),
          ignoreElements(),
        );
      }),
    );
  }

  prefetch(entityKey: string) {
    this.entities$
      .pipe(
        take(1),
        mergeMap((entities) => {
          const cached = entities[entityKey];
          if (cached) {
            return EMPTY;
          }

          return this.client.get<Day>(`${this.env.apiHost}/day/${entityKey}`).pipe(
            take(1),
            wrap(),
            tap((entityResponse) => {
              this.setEntityAction.next({ entityKey: entityKey, entity: entityResponse });
            }),
          );
        }),
      )
      .subscribe();
  }

  // invalidate a particular key in the state
  setEntity(entityKey: string, entity: Day) {
    this.setEntityAction.next({
      entityKey,
      entity: {
        loading: false,
        data: entity,
      },
    });
  }

  // server-side mutation (will need to invalidate client-side state to do a refetch)
  createBlankDay$(day: string): Observable<Day> {
    return this.client.post<Day>(`${this.env.apiHost}/day/`, {});
  }

  // server-side mutation (will need to invalidate client-side state to do a refetch)
  createDayWithMealTemplates$(day: string): Observable<Day> {
    return this.client.post<Day>(`${this.env.apiHost}/day/`, {});
  }
}

