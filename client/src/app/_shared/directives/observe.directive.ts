import {
  Directive, Input, TemplateRef, ViewContainerRef,
  OnDestroy, OnInit, ChangeDetectorRef
} from '@angular/core'
import { Observable, Subject, AsyncSubject } from "rxjs";
import { takeUntil, concatMap, switchMap, startWith } from "rxjs/operators";

export interface ObserveContext<T> {
  $implicit?: T;
  observe?: T;
}

export interface ErrorContext {
  $implicit: Error;
}

@Directive({
  selector: "[observe]",
  standalone: true,
})
export class ObserveDirective<T> implements OnDestroy, OnInit {
  // private errorRef!: TemplateRef<ErrorContext>;
  // private beforeRef!: TemplateRef<null>;
  private unsubscribe = new Subject<boolean>();
  private init = new AsyncSubject<void>();
  private source?: Observable<T>;

  constructor(
    private view: ViewContainerRef,
    private nextRef: TemplateRef<ObserveContext<T>>,
    private changes: ChangeDetectorRef,
  ) {}

  @Input()
  set observe(source: Observable<T>) {
    if (this.source && source !== this.source) {
      this.unsubscribe.next(true);
    }
    if (source && source !== this.source) {
      // this.view.clear();
      // this.view.createEmbeddedView(this.nextRef, { $implicit: undefined, observe: undefined });
      // this.showBefore();
      this.unsubscribe.next(true);
      this.init.pipe(
        concatMap(() => source.pipe(startWith(undefined))),
        takeUntil(this.unsubscribe)
      ).subscribe({
        next: value => {
          this.view.clear();
          this.view.createEmbeddedView(this.nextRef, { $implicit: value, observe: value })
          this.changes.markForCheck()
        },
        // error: error => {
        //   if (this.errorRef) {
        //     this.view.clear()
        //     this.view.createEmbeddedView(this.errorRef, {$implicit: error})
        //     this.changes.markForCheck()
        //   }
        // },
      });
    }
    this.source = source;
  }

  // @Input()
  // set observeError(ref: TemplateRef<ErrorContext>) {
  //   this.errorRef = ref;
  // }

  // @Input()
  // set observeBefore(ref: TemplateRef<null>) {
  //   this.beforeRef = ref;
  // }

  ngOnDestroy() {
    this.unsubscribe.next(true);
  }

  ngOnInit() {
    // this.showBefore();
    this.init.next();
    this.init.complete();
  }

  // private showBefore(): void {
  //   if (this.beforeRef) {
  //     this.view.clear();
  //     this.view.createEmbeddedView(this.beforeRef);
  //   }
  // }
}
