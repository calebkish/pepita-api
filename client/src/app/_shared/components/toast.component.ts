import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TOAST_CONFIG } from '../services/toast.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
<div
  [@state]="animationState$ | async"
  (@state.done)="actuallyDelete()"
  class="backdrop-blur bg-slate-700 p-3 mb-3 border-0 border-slate-600 rounded-xl text-slate-50 flex justify-between w-96 min-w-full gap-2 items-center"
>
  <p class="text-sm">{{ config.message }}</p>
  <button type="button" (click)="delete()" class="text-md font-bold bg-inherit hover:bg-slate-600 active:bg-slate-500 transition-all px-3 py-2 rounded-lg">✕</button>
  <!-- <button type="button" (click)="delete()" class="text-sm text-slate-200 bg-inherit hover:bg-slate-600 active:bg-slate-500 transition-all px-3 py-2 rounded-lg">Dismiss</button> -->
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('state', [
      state(
        'void, hidden',
        style({
          transform: 'scale(0.8)',
          opacity: 0,
        }),
      ),
      state(
        'visible',
        style({
          transform: 'scale(1)',
          opacity: 1,
        }),
      ),
      transition('* => visible', animate('150ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void, * => hidden',
        animate(
          '75ms cubic-bezier(0.4, 0.0, 1, 1)',
          style({
            opacity: 0,
          }),
        ),
      ),
    ]),
  ]
})
export class ToastComponent {
  config = inject(TOAST_CONFIG);

  animationState$ = new BehaviorSubject<string>('visible');

  delete() {
    this.animationState$.next('hidden');
  }

  actuallyDelete() {
    if (this.animationState$.value === 'visible') return;
    this.config.componentRef?.destroy();
  }
}
