import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  OverlayModule,
} from '@angular/cdk/overlay';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { filter, fromEvent, map, Subject, tap, withLatestFrom } from 'rxjs';
import { LabelCheckboxComponent } from './label-checkbox.component';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-fractional-steps-overlay',
  standalone: true,
  imports: [CommonModule, BeDirective, ReactiveFormsModule, OverlayModule, LabelCheckboxComponent, A11yModule],
  providers: [RxState, RxEffects],
  template: `
    <ng-container *appBe="state.select() | async as vm">
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="overlayOrigin"
        [cdkConnectedOverlayOpen]="vm?.isOverlayOpen ?? false"
        [cdkConnectedOverlayLockPosition]="false"
        [cdkConnectedOverlayPush]="false"
        [cdkConnectedOverlayViewportMargin]="0"
        (detach)="detach$.next()"
      >
        <div
          [formGroup]="parent"
          class="flex max-w-md flex-col gap-5 rounded-xl bg-white p-3 shadow-lg shadow-slate-700/50"
          cdkTrapFocus
        >
          <div class="flex gap-3" *ngIf="!(vm?.shouldUseScaleDecimal ?? false)">
            <app-label-checkbox [template]="halvesLabel" formControlName="halves" />
            <ng-template #halvesLabel let-checked="checked">
              <div class="text-center text-sm font-bold">
                <div>1</div>
                <hr class="border-slate-900 [max-width:1rem] mx-auto" [class.border-slate-100]="checked">
                <div>2</div>
              </div>
            </ng-template>

            <app-label-checkbox [template]="thirdsLabel" formControlName="thirds" />
            <ng-template #thirdsLabel let-checked="checked">
              <div class="text-center text-sm font-bold">
                <div>1</div>
                <hr class="border-slate-900 [max-width:1rem] mx-auto" [class.border-slate-100]="checked">
                <div>3</div>
              </div>
            </ng-template>

            <app-label-checkbox [template]="fourthsLabel" formControlName="fourths" />
            <ng-template #fourthsLabel let-checked="checked">
              <div class="text-center text-sm font-bold">
                <div>1</div>
                <hr class="border-slate-900 [max-width:1rem] mx-auto" [class.border-slate-100]="checked">
                <div>4</div>
              </div>
            </ng-template>

            <app-label-checkbox [template]="sixthsLabel" formControlName="sixths" />
            <ng-template #sixthsLabel let-checked="checked">
              <div class="text-center text-sm font-bold">
                <div>1</div>
                <hr class="border-slate-900 [max-width:1rem] mx-auto" [class.border-slate-100]="checked">
                <div>6</div>
              </div>
            </ng-template>

            <app-label-checkbox [template]="eighthsLabel" formControlName="eighths" />
            <ng-template #eighthsLabel let-checked="checked">
              <div class="text-center text-sm font-bold">
                <div>1</div>
                <hr class="border-slate-900 [max-width:1rem] mx-auto" [class.border-slate-100]="checked">
                <div>8</div>
              </div>
            </ng-template>

            <app-label-checkbox [template]="sixteenthsLabel" formControlName="sixteenths" />
            <ng-template #sixteenthsLabel let-checked="checked">
              <div class="text-center text-sm font-bold">
                <div>1</div>
                <hr class="border-slate-900 [max-width:1rem] mx-auto" [class.border-slate-100]="checked">
                <div>16</div>
              </div>
            </ng-template>

          </div>
          <div>
            <label class="flex items-center gap-2">
              <input type="checkbox" class="w-6 h-6" formControlName="shouldUseScaleDecimal">
              Should use decimal instead of fraction
            </label>
          </div>
        </div>
      </ng-template>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FractionalStepsOverlayComponent {
  effects = inject(RxEffects);
  state: RxState<{
    isOverlayOpen: boolean,
    shouldUseScaleDecimal: boolean,
  }> = inject(RxState);

  @ViewChild(CdkConnectedOverlay) cdkConnectedOverlay!: CdkConnectedOverlay;
  @ViewChild(LabelCheckboxComponent) firstCheckbox!: LabelCheckboxComponent;

  @Input() overlayOrigin!: CdkOverlayOrigin;
  @Input() parent!: FormGroup;

  @Output() escapeKeydown = new EventEmitter<void>();

  detach$ = new Subject<void>();

  constructor() {
    this.state.set({ isOverlayOpen: false });

    this.state.connect('isOverlayOpen', this.detach$.pipe(map(() => false)));
  }

  ngOnInit(): void {
    const shouldUseScaleDecimalCtrl = this.parent.get('shouldUseScaleDecimal');
    if (shouldUseScaleDecimalCtrl) {
      this.state.connect('shouldUseScaleDecimal', shouldUseScaleDecimalCtrl.valueChanges);
    }
  }

  ngAfterViewInit(): void {
    this.effects.register(
      this.state.select('isOverlayOpen').pipe(
        tap((isOverlayOpen) => {
          if (isOverlayOpen) {
            // Needed b/c view hasn't had a chance to update
            setTimeout(() => {
              this.firstCheckbox.focus();
              this.cdkConnectedOverlay.overlayRef.updatePosition();
            }, 0);
          }
        }),
      )
    );

    this.state.connect(
      'isOverlayOpen',
      fromEvent<MouseEvent>(document, 'click').pipe(
        withLatestFrom(this.state.select('isOverlayOpen')),
        map(([e, isOverlayOpen]) => {
          const clickTarget = e.target as HTMLElement;
          try {
            const hasClickedButton =
              this.overlayOrigin.elementRef.nativeElement.contains(
                clickTarget
              ) ?? false;
            const hasClickedOverlay =
              !!this.cdkConnectedOverlay.overlayRef &&
              (this.cdkConnectedOverlay.overlayRef.overlayElement.contains(
                clickTarget
              ) ??
                false);
            if (hasClickedButton) {
              return !isOverlayOpen;
            }
            return hasClickedOverlay;
          } catch {
            return false;
          }
        })
      )
    );

    this.effects.register(this.cdkConnectedOverlay.overlayKeydown.pipe(
      filter(event => event.key === 'Escape'),
      tap(() => this.escapeKeydown.emit()),
    ));
  }
}
