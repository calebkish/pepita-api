import { tap, mergeMap, distinctUntilKeyChanged, Observable, scan, shareReplay, startWith, Subject, of, ignoreElements, take, EMPTY } from "rxjs";
import { wrap, Wrapped } from "./wrap";

export class EntityCache<T extends object> {

  protected setEntityAction = new Subject<{ entityKey: string; entity: Wrapped<T> }>();

  protected entities$ = this.setEntityAction.pipe(
    scan((acc, { entityKey, entity }) => {
      if (entity.data) {
        acc[entityKey].error = undefined;
      } else if (entity.error) {
        acc[entityKey].data = undefined;
      }
      return { ...acc, [entityKey]: { ...acc[entityKey], ...entity } };
    }, {} as Record<string, Wrapped<T>>),
    startWith({} as Record<string, Wrapped<T>>),
    shareReplay(1),
  );

  constructor(
    private refetcher: (entityKey: string) => Observable<T>,
  ) {
    this.entities$.subscribe();
  }

  // client-side state
  get$(entityKey: string): Observable<Wrapped<T>> {
    return this.entities$.pipe(
      distinctUntilKeyChanged(entityKey),
      mergeMap(entities => {
        const cached = entities[entityKey];
        if (cached) {
          return of(cached);
        }

        return this.refetcher(entityKey).pipe(
          wrap(),
          tap((entityResponse) => {
            this.setEntityAction.next({ entityKey: entityKey, entity: entityResponse });
          }),
          ignoreElements(),
        );
      }),
    );
  }

  prefetch(entityKey: string): void {
    this.entities$
      .pipe(
        take(1),
        mergeMap((entities) => {
          const cached = entities[entityKey];
          if (cached) {
            return EMPTY;
          }

          return this.refetcher(entityKey).pipe(
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

  // mutate(entityKey: string, partial: Partial<T>): void {
  //   this.entities$
  //     .pipe(
  //       take(1),
  //       tap((entities) => {
  //         const cached = entities[entityKey];
  //         if (!cached?.data) {
  //           console.error(`Tried to mutate data that doesn't exist for entity key ${entityKey}`);
  //           return;
  //         }
  //         const patched = patch<T>(cached.data, partial);
  //         this.setEntity(entityKey, patched);
  //       }),
  //     ).subscribe();
  // }

  invalidate(entityKey: string): void {
    this.entities$
      .pipe(
        take(1),
        mergeMap(() => {
          return this.refetcher(entityKey).pipe(
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
  setEntity(entityKey: string, entity: T): void {
    this.setEntityAction.next({
      entityKey,
      entity: {
        loading: false,
        data: entity,
      },
    });
  }
}
