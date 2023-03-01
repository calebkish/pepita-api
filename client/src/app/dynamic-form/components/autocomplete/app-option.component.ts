import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fromEvent, map, Observable, Subject } from 'rxjs';
import { Highlightable } from '@angular/cdk/a11y';

@Component({
  selector: 'app-option',
  standalone: true,
  imports: [CommonModule],
  template: `
<div
  *ngIf="{ isActive: isActive$ | async } as vm"
  class="hover:bg-blue-500 hover:text-gray-100"
  [ngClass]="{
    'bg-gray-200 text-gray-900': !vm.isActive,
    'bg-blue-500 text-gray-100': vm.isActive
  }"
>
  <ng-content></ng-content>
</div>
  `,
  styles: [
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionComponent implements OnInit, Highlightable {
  @Input() option!: { label: string, value: any };
  click$!: Observable<string>;

  protected isActive$ = new Subject<boolean>();

  get element() {
    return this.host.nativeElement;
  }

  constructor(private host: ElementRef) {}

  ngOnInit(): void {
    this.click$ = fromEvent(this.element, 'click')
      .pipe(map(_ => this.option.value));
  }

  // === Implements Highlightable ===
  disabled?: boolean = false;
  setActiveStyles(): void {
    this.isActive$.next(true);
  }
  setInactiveStyles(): void {
    this.isActive$.next(false);
  }
  getLabel?(): string {
    return this.option.label;
  }

}
