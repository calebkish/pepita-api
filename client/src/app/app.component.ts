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

    <nav class="flex flex-col order-last sm:order-first text-slate-300">
      <div class="justify-between bg-slate-600 items-center p-3 ">
        <ul class="flex justify-center gap-7 mx-auto max-w-sm w-full">
          <ng-container *ngIf="vm?.account; else notLoggedIn">
            <li *ngFor="let route of authorizedRoutes">
              <a
                [routerLink]="route.link"
                class="flex flex-col font-bold items-center"
                routerLinkActive="text-white"
                [routerLinkActiveOptions]="{exact:true}"
              >
                <span class="material-symbols-filled text-3xl">{{route.icon}}</span>
                <p class="text-sm">{{route.title}}</p>
              </a>
            </li>
          </ng-container>

          <ng-template #notLoggedIn>
            <li *ngFor="let route of nonAuthorizedRoutes">
              <a
                [routerLink]="route.link"
                class="flex flex-col font-bold items-center"
                routerLinkActive="text-white"
                [routerLinkActiveOptions]="{exact:true}"
              >
                <span class="material-symbols-filled text-3xl">{{route.icon}}</span>
                <p class="text-sm">{{route.title}}</p>
              </a>
            </li>
          </ng-template>
        </ul>
      </div>
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
    {
      title: 'Foods',
      icon: 'egg_alt',
      link: 'foods',
    },
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
