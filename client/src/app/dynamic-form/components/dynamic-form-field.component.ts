import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControlStatus, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FieldBase } from '../models/field-base';
import { RxState, selectSlice } from '@rx-angular/state';
import { filter, map, merge, Observable, switchMap, withLatestFrom } from 'rxjs';
import { getFormControlValidationMessage } from 'src/app/_shared/util/get-form-group-errors';
import { TextInputComponent } from "./text-input.component";
import { CtrlInGroupPipe } from '../pipes/ctrl-in-group.pipe';

@Component({
    selector: 'app-field',
    standalone: true,
    template: `
    <ng-container *ngIf="state.select() | async as vm">
      <div [formGroup]="vm.form">
        <div [ngSwitch]="vm.field.controlType">


          <ng-container *ngSwitchCase="'textbox'">
            <app-text-input
              formCtrlName="vm.field.key"
              [label]="vm.field.label"
              [type]="vm.field.type"
              [customError]="vm.validationError ?? vm.serverError"
            ></app-text-input>
          </ng-container>


          <ng-container *ngSwitchCase="'dropdown'">
            <label [attr.for]="vm.field.key">{{vm.field.label}}</label>
            <select [id]="vm.field.key" [formControlName]="vm.field.key">
              <option *ngFor="let opt of vm.field.options" [value]="opt.key">{{opt.value}}</option>
            </select>
          </ng-container>


        </div>
      </div>
    </ng-container>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [RxState],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TextInputComponent, CtrlInGroupPipe]
})
export class DynamicFormFieldComponent {
  protected readonly state: RxState<{
    pollValidationErrors$: Observable<void>,
    form: FormGroup,
    field: FieldBase<string>,
    serverError: string,

    controlChanges: FormControlStatus,
    control: AbstractControl,
    validationError: string | null,
  }> = inject(RxState);

  @Input() set pollValidationErrors$(pollValidationErrors$: Observable<void>) {
    this.state.set({ pollValidationErrors$ });
  }
  @Input() set form(form: FormGroup) {
    this.state.set({ form });
  }
  @Input() set field(field: FieldBase<string>) {
    this.state.set({ field });
  }
  @Input() set serverError(serverError: string) {
    this.state.set({ serverError });
  }

  constructor() {
    this.state.connect('controlChanges', this.state.select('control').pipe(
      switchMap(control => control.statusChanges),
    ));

    this.state.connect('control', this.state.select(selectSlice(['form', 'field'])).pipe(
      map(({ form, field }) => form.get(field.key)),
      filter((control): control is AbstractControl => !!control),
    ));

    this.state.connect('validationError', merge(
      this.state.select('controlChanges'),
      this.state.select('pollValidationErrors$').pipe(
        switchMap(obs => obs),
      ),
    ).pipe(
      withLatestFrom(this.state.select('control')),
      map(([_, control]) => {
        const validatorName = Object.keys(control.errors ?? {})[0];
        const message = getFormControlValidationMessage(validatorName);
        return message;
      })
    ));
  }
}
