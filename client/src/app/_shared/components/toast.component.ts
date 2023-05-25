import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TOAST_CONFIG } from '../services/toast.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RxEffects } from '@rx-angular/state/effects';
import { GlobalPositionStrategy } from '@angular/cdk/overlay';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  providers: [RxEffects],
  template: `
<div class="p-3">
  <div
    [@state]="animationState$ | async"
    (@state.done)="actuallyDelete()"
    class="backdrop-blur-sm bg-slate-700/80 p-3 rounded-xl text-slate-50 flex justify-between w-full gap-2 items-center"
  >
    <p class="text-sm">{{ config.message }}</p>
    <button
      type="button"
      (click)="delete()"
      class="text-md font-bold bg-inherit hover:bg-slate-600/90 active:bg-slate-500/90 transition-all px-3 py-2 rounded-lg"
    >
      ✕
    </button>
  </div>
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
  protected config = inject(TOAST_CONFIG);
  private breakpointObserver = inject(BreakpointObserver);
  private effects = inject(RxEffects);

  ngOnInit() {
    const tailwindLessThanSm = '(max-width: 640px)';
    const tailwindSm = '(min-width: 640px)';

    this.effects.register(this.breakpointObserver
      .observe([tailwindLessThanSm, tailwindSm])
      .pipe(
        tap(result => {
          const activeMediaQuery = Object.entries(result.breakpoints)
            .find(([_, isActive]) => isActive)?.[0];

          if (activeMediaQuery && activeMediaQuery === tailwindLessThanSm) {
            const posStrat = new GlobalPositionStrategy()
              .top('0')
              .centerHorizontally();
            this.config.overlayRef.updatePositionStrategy(posStrat);
            this.config.overlayRef.updatePosition();
          } else {
            const posStrat = new GlobalPositionStrategy()
              .bottom('0')
              .centerHorizontally()
            this.config.overlayRef.updatePositionStrategy(posStrat);
            this.config.overlayRef.updatePosition();
          }
        }),
      ),
    );
  }

  protected animationState$ = new BehaviorSubject<string>('visible');

  delete() {
    this.animationState$.next('hidden');
  }

  protected actuallyDelete() {
    if (this.animationState$.value === 'visible') return;
    this.config.componentRef?.destroy();
  }
}
