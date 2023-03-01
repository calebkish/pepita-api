import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeDirective } from '../_shared/directives/let.directive';
import { RxState } from '@rx-angular/state';
import { RxEffects } from '@rx-angular/state/effects';
import { ShoppingList, ShoppingListService, Store } from '../_shared/services/shopping-list.service';
import { wrap, Wrapped } from '../_shared/util/wrap';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-shopping-lists',
    standalone: true,
    template: `
<div *appBe="state.select() | async as vm" class="flex flex-col gap-8 max-w-lg mx-auto p-5">

  <!-- <div> -->
  <!--   <div class="flex justify-between"> -->
  <!--     <h2 class="text-2xl font-bold text-slate-900">Stores</h2> -->
  <!--     <button routerLink="/stores/create" class="btn btn-primary">Create store</button> -->
  <!--   </div> -->
  <!--   <div *ngIf="vm?.stores?.data?.length; else noStores" class="mt-4 flex flex-col gap-3"> -->
  <!--     <div *ngFor="let store of vm?.stores?.data ?? []" class="bg-slate-100 w-100 p-4 rounded-xl flex items-center justify-between"> -->
  <!--       <a routerLink="/stores/{{store.id}}/edit" class="text-lg flex items-center"> -->
  <!--         {{ store.name }} -->
  <!--       </a> -->
  <!--     </div> -->
  <!--   </div> -->
  <!--   <ng-template #noStores> -->
  <!--     <p class="text-slate-600 text-center py-5 text-sm">No stores exist.</p> -->
  <!--   </ng-template> -->
  <!-- </div> -->

  <div>
    <div class="flex justify-between">
      <h2 class="text-2xl font-bold text-slate-900">Shopping lists</h2>
      <button routerLink="/shopping-lists/create" class="btn btn-primary">Create list</button>
    </div>
    <div *ngIf="vm?.shoppingLists?.data?.length; else noLists" class="mt-4 flex flex-col gap-3">
      <div *ngFor="let shoppingList of vm?.shoppingLists?.data ?? []" class="bg-slate-100 w-100 p-4 rounded-xl flex items-center justify-between">
        <a routerLink="/shopping-lists/{{shoppingList.id}}/edit" class="text-lg flex items-center">
          {{ shoppingList.startDay | date }} - {{ shoppingList.endDay | date }}
        </a>
      </div>
    </div>
    <ng-template #noLists>
      <p class="text-slate-600 text-center py-5 text-sm">No shopping lists exist.</p>
    </ng-template>
  </div>

</div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [RxState, RxEffects],
    imports: [CommonModule, BeDirective, RouterModule]
})
export class ShoppingListsComponent {
  shoppingListService = inject(ShoppingListService);
  state: RxState<{
    stores: Wrapped<Store[]>,
    shoppingLists: Wrapped<ShoppingList[]>
  }> = inject(RxState);

  constructor() {
    this.state.connect('stores', this.shoppingListService.getStores$().pipe(
      wrap(),
    ));

    this.state.connect('shoppingLists', this.shoppingListService.getShopppingLists$().pipe(
      wrap(),
    ));
  }

}
