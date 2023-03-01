import { inject } from '@angular/core';
import { Router, Routes, CanActivateFn, CanActivateChildFn, CanMatchFn } from '@angular/router';
import { map } from 'rxjs';
import { LoginPageComponent } from './auth/components/login-page.component';
import { SignupPageComponent } from './auth/components/signup-page.component';
import { createLoginWithRedirectPath } from './auth/util/create-login-with-redirect-path';
import { BatchRecipeInstanceFormComponent } from './batch-recipe-instance/batch-recipe-instance-form.component';
import { BatchRecipeFormComponent } from './batch-recipe/batch-recipe-form.component';
import { FoodInstanceFormComponent } from './food-instance-form/food-instance-form.component';
import { RecipeInstanceFormComponent } from './recipe-instance-form/recipe-instance-form.component';
import { FoodCreateComponent } from './foods/components/food-create.component';
import { FoodDetailComponent } from './foods/components/food-detail.component';
import { FoodEditComponent } from './foods/components/food-edit.component';
import { FoodsListComponent } from './foods/components/foods-list.component';
import { RecipeFormComponent } from './recipe-form/recipe-form.component';
import { RecipesListComponent } from './recipes-list/recipes-list.component';
import { AccountDetailComponent } from './_shared/components/account-detail.component';
import { DashboardComponent } from './_shared/components/dashboard.component';
import { LandingPageComponent } from './_shared/components/landing-page.component';
import { AuthService } from './_shared/services/auth.service';
import { StoreFormComponent } from './shopping-list/store-form.component';
import { ShoppingListsComponent } from './shopping-list/shopping-lists.component';
import { ShoppingListFormComponent } from './shopping-list/shopping-list-form.component';


const canActivateChildUserPage: CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.account$.pipe(
    map(account => {
      if (account === null) {
        return router.parseUrl(createLoginWithRedirectPath(state.url));
      } else {
        return true;
      }
    }),
  );
};

const matchIfLoggedIn: CanMatchFn = (route, segments) => {
  return inject(AuthService).account$.pipe(
    map(account => !!account),
  );
}

const canActivateNonAuthorizedRoute: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.account$.pipe(
    map(account => {
      return account === null
        ? true
        : router.parseUrl('');
    }),
  );
};

export enum Layout {
  Cover = 'COVER',
  Constained = 'CONSTRAINED',
}

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Dashboard',
    canMatch: [matchIfLoggedIn],
    pathMatch: 'full',
  },
  {
    path: '',
    component: LandingPageComponent,
    title: 'Pepita'
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Login',
    canActivate: [canActivateNonAuthorizedRoute],
  },
  {
    path: 'register',
    component: SignupPageComponent,
    title: 'Register an account',
    canActivate: [canActivateNonAuthorizedRoute],
  },
  {
    path: '',
    canActivateChild: [canActivateChildUserPage],
    children: [
      {
        path: 'account',
        component: AccountDetailComponent,
        title: 'Account',
      },
      {
        path: 'foods',
        component: FoodsListComponent,
        title: 'Foods',
      },
      {
        path: 'foods/create',
        component: FoodCreateComponent,
        title: 'Create food',
      },
      {
        path: 'foods/:foodId',
        component: FoodDetailComponent,
        title: 'Food detail',
      },
      {
        path: 'foods/:foodId/edit',
        component: FoodEditComponent,
        title: 'Food edit',
      },
      {
        path: 'recipes',
        component: RecipesListComponent,
        title: 'Recipes',
      },
      {
        path: 'recipes/create',
        component: RecipeFormComponent,
        title: 'Create recipe',
      },
      {
        path: 'recipes/:recipeId/edit',
        component: RecipeFormComponent,
        title: 'Edit recipe',
      },
      {
        path: 'batch-recipes/create',
        component: BatchRecipeFormComponent,
        title: 'Create batch recipe',
      },
      {
        path: 'batch-recipes/:batchRecipeId/edit',
        component: BatchRecipeFormComponent,
        title: 'Edit batch recipe',
      },
      {
        path: 'batch-recipe-instances/create',
        component: BatchRecipeInstanceFormComponent,
        title: 'Create batch recipe instance',
      },
      {
        path: 'batch-recipe-instances/:batchRecipeInstanceId/edit',
        component: BatchRecipeInstanceFormComponent,
        title: 'Edit batch recipe instance',
      },
      {
        path: 'recipe-instances/create',
        component: RecipeInstanceFormComponent,
        title: 'Create recipe instance',
      },
      {
        path: 'recipe-instances/:recipeInstanceId/edit',
        component: RecipeInstanceFormComponent,
        title: 'Edit recipe instance',
      },
      {
        path: 'food-instances/create',
        component: FoodInstanceFormComponent,
        title: 'Create food instance',
      },
      {
        path: 'food-instances/edit',
        component: FoodInstanceFormComponent,
        title: 'Edit food instance',
      },
      {
        path: 'stores/create',
        component: StoreFormComponent,
        title: 'Create store',
      },
      {
        path: 'stores/:storeId/edit',
        component: StoreFormComponent,
        title: 'Edit store',
      },
      {
        path: 'shopping-lists',
        component: ShoppingListsComponent,
        title: 'Shopping lists',
      },
      {
        path: 'shopping-lists/create',
        component: ShoppingListFormComponent,
        title: 'Create shopping list',
      },
      {
        path: 'shopping-lists/:shoppingListId/edit',
        component: ShoppingListFormComponent,
        title: 'Edit shopping list',
      },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];


// lazy routes: `https://blog.angular.io/angular-v15-is-now-available-df7be7f2f4c8`
