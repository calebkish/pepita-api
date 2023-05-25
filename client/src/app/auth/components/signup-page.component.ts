import { ChangeDetectionStrategy, inject } from '@angular/core';
import { Component } from '@angular/core';
import { TextInputComponent } from "../../dynamic-form/components/text-input.component";
import { SubmitButtonComponent } from "../../dynamic-form/components/submit-button.component";
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Account, AuthService } from 'src/app/_shared/services/auth.service';
import { Router } from '@angular/router';
import { RxState } from '@rx-angular/state';
import { Wrapped } from 'src/app/_shared/util/wrap';
import { RxEffects } from '@rx-angular/state/effects';
import { filter, Subject, switchMap, tap } from 'rxjs';
import { requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { CommonModule } from '@angular/common';
import { BeDirective } from 'src/app/_shared/directives/let.directive';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div *appBe="state.select() | async as vm" class="flex h-full items-center justify-center bg-slate-100 p-5">
  <div class="rounded-lg p-5 shadow-2xl w-full max-w-md bg-white flex flex-col gap-5">
    <p class="text-2xl font-bold">Register an account</p>
    <form (ngSubmit)="onSubmit.next()" [formGroup]="form">
      <app-text-input
        formCtrlName="username"
        label="Username"
        [customError]="vm?.registerResponse?.error?.username"
      />
      <app-text-input
        type="password"
        formCtrlName="password"
        label="Password"
        [customError]="vm?.registerResponse?.error?.password"
      />
      <app-text-input
        type="password"
        formCtrlName="passwordConfirm"
        label="Confirm Password"
        [customError]="vm?.registerResponse?.error?.passwordConfirm"
      />
      <app-submit-button></app-submit-button>
    </form>
</div>
  `,
  imports: [CommonModule, TextInputComponent, SubmitButtonComponent, ReactiveFormsModule, BeDirective],
  providers: [RxState, RxEffects],
})
export class SignupPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly state: RxState<{
    registerResponse: Wrapped<Account>,
    account: Account | null,
  }> = inject(RxState);
  private readonly effects = inject(RxEffects);

  protected readonly onSubmit = new Subject<void>();

  protected readonly form = this.fb.group({
    username: this.fb.control('', [requiredValidator]),
    password: this.fb.control('', [requiredValidator]),
    passwordConfirm: this.fb.control('', [requiredValidator]),
  }, { updateOn: 'submit' });

  constructor() {
    this.state.connect('registerResponse', this.onSubmit.pipe(
      filter(() => this.form.valid),
      switchMap(() => {
        const { username, password, passwordConfirm } = this.form.value;
        return this.authService.register$(username!, password!, passwordConfirm!);
      }),
      tap((response) => {
        if (response.data) {
          this.authService.setAccount$.next(response.data);
        }
      }),
    ));

    this.effects.register(this.authService.account$.pipe(
      tap(account => {
        if (account) {
          this.router.navigateByUrl('');
        }
      }),
    ));
  }
}
