import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RxState } from '@rx-angular/state';
import { RxActionFactory } from '@rx-angular/state/actions';
import { tap, Subject, switchMap, filter } from 'rxjs';
import { Account, AuthService } from 'src/app/_shared/services/auth.service';
import { getRedirectQueryParam } from '../util/get-redirect-query-param';
import { TextInputComponent } from "../../dynamic-form/components/text-input.component";
import { requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { ObserveDirective } from 'src/app/_shared/directives/observe.directive';
import { SubmitButtonComponent } from "../../dynamic-form/components/submit-button.component";
import { BeDirective } from 'src/app/_shared/directives/let.directive';
import { RxEffects } from '@rx-angular/state/effects';
import { Wrapped } from 'src/app/_shared/util/wrap';

@Component({
    selector: 'app-login-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [RxState, RxEffects, RxActionFactory],
    template: `
<div *appBe="state.select() | async as vm" class="flex h-full items-center justify-center bg-slate-100 p-5">
  <div class="rounded-lg p-5 shadow-2xl w-full max-w-md bg-white flex flex-col gap-5">
    <p class="text-2xl font-bold">Login</p>
    <form (ngSubmit)="onSubmit.next()" [formGroup]="form">
      <app-text-input
        formCtrlName="username"
        label="Username"
        [customError]="vm?.loginResponse?.error?.username"
      ></app-text-input>
      <app-text-input
        type="password"
        formCtrlName="password"
        label="Password"
        [customError]="vm?.loginResponse?.error?.password"
      ></app-text-input>
      <app-submit-button></app-submit-button>
    </form>

    <div class="relative bg-white flex justify-center">
      <hr class="border-slate-600 absolute top-3 left-0 right-0 w-full h-full">
      <p class="text-slate-600 relative bg-inherit z-10 inline-block px-3">OR</p>
    </div>

    <a
      class="cursor-pointer rounded-lg py-2 px-3 text-slate-800 transition-all active:scale-95 bg-slate-200 active:bg-slate-300 w-full text-center"
      routerLink="/register"
    >
      Register an account
    </a>
  </div>
</div>
  `,
    imports: [ReactiveFormsModule, CommonModule, TextInputComponent,
      ObserveDirective, SubmitButtonComponent, BeDirective, RouterModule],
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly state: RxState<{
    loginResponse: Wrapped<Account>,
    account: Account | null,
  }> = inject(RxState);
  private readonly effects = inject(RxEffects);

  protected readonly onSubmit = new Subject<void>();

  protected readonly form = this.fb.group({
    username: this.fb.control('', [requiredValidator]),
    password: this.fb.control('', [requiredValidator])
  }, { updateOn: 'submit' });

  constructor() {
    this.state.connect('loginResponse', this.onSubmit.pipe(
      filter(() => this.form.valid),
      switchMap(() => {
        const { username, password } = this.form.value;
        return this.authService.login$(username!, password!);
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
          this.router.navigateByUrl(getRedirectQueryParam() || '');
        }
      }),
    ));
  }
}
