import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { Observable, catchError, of, Subject, switchMap, filter } from 'rxjs';
import { MealTemplate } from '../models/meal-template';
import { wrap, Wrapped } from '../util/wrap';
import { EnvironmentService } from './environment.service';

export interface Account {
  username: string;
  role: 'TRIAL' | 'ADMIN' | 'USER';
  expirationTimestamp: string | null;
}

export interface AccountSettings {
  autoCreatedMealTemplates: MealTemplate[];
  dailyTargetProtein: number;
  dailyTargetCalories: number;
  dailyTargetCarbohydrates: number;
  dailyTargetFat: number;
}

export interface PostAccountSettingsRequest {
  autoCreatedMealTemplates?: Omit<MealTemplate, 'id'>[];
  dailyTargetProtein?: number;
  dailyTargetCalories?: number;
  dailyTargetCarbohydrates?: number;
  dailyTargetFat?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService extends RxState<{
  account: Account | null,
  accountSettings: AccountSettings,
}> {
  // actions
  readonly setAccount$ = new Subject<Account | null>();
  readonly setSettings$ = new Subject<AccountSettings>();

  readonly account$: Observable<Account | null> = this.select('account');

  readonly settings$: Observable<AccountSettings> = this.select('accountSettings');

  constructor(
    private env: EnvironmentService,
    private client: HttpClient,
  ) {
    super();

    this.connect('account', this.getUserInfo$().pipe(
      catchError((_) => of(null))
    ));
    this.connect('account', this.setAccount$);



    this.connect('accountSettings', this.select('account').pipe(
      filter((account): account is Account => !!account),
      switchMap(_ => this.getSettings$()),
    ));
    this.connect('accountSettings', this.setSettings$);
  }

  login$(username: string, password: string): Observable<Wrapped<Account>> {
    return this.client
      .post<Account>(`${this.env.apiHost}/auth/login`, { username, password })
      .pipe(wrap((e) => e.error.errors));
  }

  register$(username: string, password: string, passwordConfirm: string): Observable<Wrapped<Account>> {
    return this.client
      .post<Account>(`${this.env.apiHost}/auth/register`, { username, password, passwordConfirm })
      .pipe(wrap((e) => e.error.errors));
  }

  trialRegister$(): Observable<Wrapped<Account>> {
    return this.client
      .post<Account>(`${this.env.apiHost}/auth/trial-register`, {})
      .pipe(wrap((e) => e.error.errors));
  }

  logout$(): Observable<any> {
    return this.client.post<any>(`${this.env.apiHost}/auth/logout`, {});
  }

  getSettings$(): Observable<AccountSettings> {
    return this.client.get<AccountSettings>(`${this.env.apiHost}/auth/settings`);
  }

  postSettings$(newSettings: PostAccountSettingsRequest): Observable<AccountSettings> {
    return this.client.post<AccountSettings>(`${this.env.apiHost}/auth/settings`, newSettings);
  }

  private getUserInfo$(): Observable<Account> {
    return this.client.get<Account>(`${this.env.apiHost}/auth/current`);
  }
}
