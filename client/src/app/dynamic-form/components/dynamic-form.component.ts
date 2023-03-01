import { ChangeDetectionStrategy, Component, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldBase } from '../models/field-base';
import { FormControl, FormControlStatus, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { combineLatest, filter, map, Subject, switchMap } from 'rxjs';
import { DynamicFormFieldComponent } from './dynamic-form-field.component';

// Usage:
  // protected readonly fields: FieldBase<string>[] = [
  //   new TextboxField({
  //     key: 'email',
  //     label: 'Email',
  //     type: 'email',
  //     validators: [Validators.required, Validators.email],
  //     order: 1
  //   }),
  //   new TextboxField({
  //     key: 'password',
  //     label: 'Password',
  //     type: 'password',
  //     validators: [Validators.required],
  //     order: 2,
  //   }),
  // ];


@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  template: `
    <div *ngIf="state.select() | async as vm">
      <form (ngSubmit)="onSubmit$.next()" [formGroup]="vm.form">
        <div *ngFor="let field of vm.fields">
          <app-field
            [field]="field"
            [form]="vm.form"
            [serverError]="vm.serverErrors?.[field.key] ?? undefined"
            [pollValidationErrors$]="onSubmit$"
          ></app-field>
        </div>

        <div>
          <button class="btn btn-primary" type="submit">Save</button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  imports: [CommonModule, ReactiveFormsModule, DynamicFormFieldComponent],
})
export class DynamicFormComponent {
  protected readonly state: RxState<{
    fields: FieldBase<string>[],
    form: FormGroup,
    serverErrors?: Record<string, any>,
    formChanges: { value: any, status: FormControlStatus },
  }> = inject(RxState);

  @Input() set fields(fields: FieldBase<string>[]) {
    this.state.set({ fields });
  }

  @Input() set serverErrors(serverErrors: Record<string, any>) {
    this.state.set({ serverErrors });
  }

  onSubmit$ = new Subject<void>();

  @Output() submit = this.onSubmit$.pipe(
    switchMap(_ => this.state.select('formChanges').pipe(
      filter(({ status }) => status === 'VALID'),
      map(({ value }) => value),
    ))
  );

  constructor() {
    this.state.connect('form', this.state.select('fields').pipe(
      map((fields) => {
        return toFormGroup(fields);
      }),
    ));

    this.state.connect('formChanges', this.state.select('form').pipe(
      switchMap(form => combineLatest({
        value: form.valueChanges,
        status: form.statusChanges,
      })),
    ));
  }
}

function toFormGroup(fields: FieldBase<string>[]): FormGroup {
  const group: any = {};
  fields.forEach(field => {
    group[field.key] = new FormControl(field.value || '', field.validators);
  });
  return new FormGroup(group, { updateOn: 'submit' });
}
