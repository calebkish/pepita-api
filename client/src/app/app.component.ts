import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RxState } from '@rx-angular/state';
import { BeDirective } from './_shared/directives/let.directive';
import { Account, AuthService } from './_shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, ScrollingModule, NgFor, BeDirective],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<ng-container *appBe="state.select() | async as vm" >
  <div class="h-screen flex flex-col">

    <div *ngIf="vm?.account?.expirationTimestamp as ts" class="text-center bg-slate-700 text-white p-1">
      You are currently on a trial account. Your trial account will expire on <strong>{{ ts | date:'medium' }}</strong>
    </div>

    <nav class="order-last sm:order-first text-slate-300 bg-slate-600 sticky bottom-0 p-1 py-2 sm:p-2">
      <ul class="flex justify-between mx-auto max-w-sm w-min">
        <li *ngFor="let route of (vm?.account ? authorizedRoutes : nonAuthorizedRoutes)" class="px-2">
          <a
            [routerLink]="route.link"
            class="flex flex-col font-bold items-center"
            routerLinkActive="text-white"
            [routerLinkActiveOptions]="{exact:true}"
          >
            <span class="material-symbols-filled text-xl sm:text-3xl">{{route.icon}}</span>
            <p class="text-sm">{{route.title}}</p>
          </a>
        </li>
      </ul>
    </nav>

    <div class="w-full flex-1 mx-auto overflow-y-auto" cdkScrollable>
      <router-outlet></router-outlet>
    </div>

  </div>
</ng-container>
  `,
  providers: [RxState],
})
export class AppComponent {
  authService = inject(AuthService);
  state: RxState<{
    account: Account | null,
  }> = inject(RxState);

  authorizedRoutes = [
    {
      title: 'Diary',
      icon: 'today',
      link: '',
    },
    // {
    //   title: 'Foods',
    //   icon: 'egg_alt',
    //   link: 'foods',
    // },
    {
      title: 'Recipes',
      icon: 'ramen_dining',
      link: 'recipes',
    },
    {
      title: 'Shopping',
      icon: 'checklist',
      link: 'shopping-lists',
    },
    {
      title: 'Account',
      icon: 'person',
      link: 'account',
    },
  ];

  nonAuthorizedRoutes = [
    {
      title: 'Login/Register',
      icon: 'login',
      link: 'login'
    },
  ];

  constructor() {
    this.state.connect('account', this.authService.account$.pipe(
      // tap(console.log),
    ));
  }
}
