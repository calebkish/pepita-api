import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxState } from '@rx-angular/state';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { tap } from 'rxjs';
import { runValidationRec } from '../util/run-validation-rec';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { RxEffects } from '@rx-angular/state/effects';

const shakeAnimation = [
  style({
    transform: 'translateX(0)',
  }),
  animate('0.1s ease-in-out', style({
    transform: 'translateX(5px)',
    background: '#ef4444',
  })),
  animate('0.1s ease-in-out', style({
    transform: 'translateX(-5px)',
  })),
  animate('0.1s ease-in-out', style({
    transform: 'translateX(5px)',
  })),
  animate('0.1s ease-in-out', style({
    transform: 'translateX(0)',
    background: '#64748B',
  })),
];

export const QueryShake = [
  trigger('queryShake', [
    transition('* => default', shakeAnimation),
  ]),
];

@Component({
  selector: 'app-submit-button',
  standalone: true,
  imports: [CommonModule, BeDirective],
  template: `
<ng-container *appBe="state.select() | async as vm">
  <button
    type="submit"
    class="cursor-pointer rounded-lg py-2 px-3 text-white transition-all active:scale-95 bg-slate-500 active:bg-slate-600 w-full"
    [@queryShake]="vm?.submitBtnAnimation ?? 'idle'"
    (@queryShake.done)="state.set({ submitBtnAnimation: 'idle' })"
  >
    {{label}}
  </button>
</ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
    RxState,
    RxEffects,
  ],
  styles: [`
    :host {
      width: 100%;
    }
  `],
  animations: [QueryShake],
})
export class SubmitButtonComponent {
  protected readonly effects = inject(RxEffects);
  protected readonly state: RxState<{
    submitBtnAnimation: 'idle' | 'default',
  }> = inject(RxState);

  // This isn't available until `ngOnInit`
  protected readonly parent = inject(FormGroupDirective);

  @Input() label = 'Submit';

  constructor() {
    this.state.set({ submitBtnAnimation: 'idle' });
  }

  ngOnInit(): void {
    this.effects.register(this.parent.ngSubmit.pipe(
      tap(() => {
        runValidationRec([this.parent.form], true);
        if (this.parent.form.invalid) {
          this.state.set({ submitBtnAnimation: 'default' });
        }
      }),
    ));
  }

}
