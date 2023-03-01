import { AfterContentInit, ChangeDetectionStrategy, Component, ContentChild, ContentChildren, OnDestroy, QueryList, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionComponent } from './app-option.component';
import { merge, Observable, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs';
import { AutocompleteContentDirective } from './autocomplete-content.directive';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule],
  template: `
<!-- Wrapped in ng-template to keep the instantiation lazy; we only want to
create OptionComponents when the autocomplete dropdown is opened -->
<ng-template #root>
  <div class="w-full" *ngIf="{ content: content$ | async } as vm">
    <!-- We aren't using <ng-content> here because we don't have control over
    when the content is rendered -->
    <ng-container *ngIf="vm.content">
      <ng-container *ngTemplateOutlet="vm.content.tpl"></ng-container>
    </ng-container>
  </div>
</ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'appAutocomplete',
})
export class AutocompleteComponent implements AfterContentInit, OnDestroy {
  @ViewChild('root', { static: true }) rootTemplate!: TemplateRef<any>;

  // Queries for the directive inside of the tags of this component (`<app-autocomplete></app-autocomplete>`).
  content$ = new ReplaySubject<AutocompleteContentDirective>(1);
  @ContentChild(AutocompleteContentDirective)
  set content(content: AutocompleteContentDirective) { this.content$.next(content); }

  @ContentChildren(OptionComponent) options!: QueryList<OptionComponent>;

  private keyManager!: ActiveDescendantKeyManager<OptionComponent>;

  private onDestroy$ = new ReplaySubject<void>(1);
  ngOnDestroy(): void {
    this.onDestroy$.next();
  }

  ngAfterContentInit(): void {
    this.options.changes
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(_ => {
        this.keyManager = new ActiveDescendantKeyManager(this.options)
          .withWrap(false)
          .withTypeAhead();
      });
  }

  private readonly onEnter$ = new Subject<string>();

  onKeydown(event: any): void {
    if (event.keyCode === ENTER) {
      event.preventDefault();
      if (!this.keyManager.activeItem) {
        console.warn('No active item selected!');
        return;
      }
      this.onEnter$.next(this.keyManager.activeItem.option.value);
    } else {
      this.keyManager.onKeydown(event);
    }
  }

  value$(): Observable<string> {
    const allOptionClicks$: Observable<string> = this.options.changes.pipe(
      switchMap((options: OptionComponent[]) => {
        const clicks$ = options.map((option) => option.click$);
        return merge(...clicks$);
      }),
    );
    return merge(this.onEnter$, allOptionClicks$);
  }

}
