// import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { BeDirective } from 'src/app/_shared/directives/let.directive';
// import { RxState } from '@rx-angular/state';
// import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectionPositionPair, OverlayModule } from '@angular/cdk/overlay';
// import { debounceTime, distinctUntilChanged, fromEvent, map, tap, withLatestFrom, filter, switchMap, of, merge, Subject } from 'rxjs';
// import { NonNullableFormBuilder } from '@angular/forms';
// import { TextInputComponent } from 'src/app/dynamic-form/components/text-input.component';
// import { FoodService, SearchResponse } from 'src/app/foods/services/food.service';
// import { RxEffects } from '@rx-angular/state/effects';
// import { A11yModule } from '@angular/cdk/a11y';
//
// export type SearchResult<T extends keyof SearchResponse> = {
//   type: T;
//   item: SearchResponse[T][number];
// };
//
// @Component({
//   selector: 'app-search-overlay',
//   standalone: true,
//   imports: [CommonModule, BeDirective, OverlayModule, TextInputComponent, A11yModule],
//   providers: [RxState, RxEffects],
//   template: `
// <ng-container *appBe="state.select() | async as vm">
//   <ng-template
//     cdkConnectedOverlay
//     [cdkConnectedOverlayOrigin]="overlayOrigin"
//     [cdkConnectedOverlayOpen]="vm?.isFoodSearchOpen ?? false"
//     [cdkConnectedOverlayLockPosition]="false"
//     [cdkConnectedOverlayPositions]="positionPairs"
//     [cdkConnectedOverlayPush]="false"
//     [cdkConnectedOverlayViewportMargin]="0"
//     [cdkConnectedOverlayGrowAfterOpen]="false"
//     (detach)="detach$.next()"
//   >
//     <div
//       class="bg-white p-3 shadow-lg shadow-slate-700/50 rounded-xl flex flex-col gap-3 max-w-md"
//       cdkTrapFocus
//     >
//       <app-text-input
//         class="block [height:44px]"
//         [showLabel]="false"
//         label="Search"
//         [ctrl]="searchControl"
//         placeholder="Search..."
//       ></app-text-input>
//
//       <div *ngIf="vm?.queried?.foods?.length" class="flex flex-col">
//         <p class="text-lg text-slate-800 font-bold">Foods</p>
//         <div class="flex flex-col gap-3 overflow-y-auto max-h-32">
//           <button
//             *ngFor="let food of vm?.queried?.foods ?? []"
//             type="button"
//             (click)="onResultSelect({ type: 'foods', item: food })"
//             class="hover:bg-slate-200 p-3 active:bg-slate-300 w-full text-left text-sm bg-slate-100 rounded-md"
//           >
//             <p class="whitespace-nowrap [text-overflow:ellipsis] overflow-x-hidden">{{ food.name }}</p>
//           </button>
//         </div>
//       </div>
//
//
//       <div *ngIf="vm?.queried?.recipes?.length" class="flex flex-col">
//         <p class="text-lg text-slate-800 font-bold">Recipes</p>
//         <div class="flex flex-col gap-3 overflow-y-auto max-h-32">
//           <button
//             *ngFor="let recipe of vm?.queried?.recipes ?? []"
//             type="button"
//             (click)="onResultSelect({ type: 'recipes', item: recipe })"
//             class="hover:bg-slate-200 p-3 active:bg-slate-300 w-full text-left text-sm bg-slate-100 rounded-md"
//           >
//             <p class="whitespace-nowrap [text-overflow:ellipsis] overflow-x-hidden">{{ recipe.name }}</p>
//           </button>
//         </div>
//       </div>
//
//       <div *ngIf="vm?.queried?.batchRecipes?.length" class="flex flex-col">
//         <p class="text-lg text-slate-800 font-bold">Batch Recipes</p>
//         <div class="flex flex-col gap-3 overflow-y-auto max-h-32">
//           <button
//             *ngFor="let batchRecipe of vm?.queried?.batchRecipes ?? []"
//             type="button"
//             (click)="onResultSelect({ type: 'batchRecipes', item: batchRecipe })"
//             class="hover:bg-slate-200 p-3 active:bg-slate-300 w-full text-left text-sm bg-slate-100 rounded-md"
//           >
//             <p class="whitespace-nowrap [text-overflow:ellipsis] overflow-x-hidden">{{ batchRecipe.name }}</p>
//           </button>
//         </div>
//       </div>
//
//     </div>
//   </ng-template>
// </ng-container>
//   `,
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class SearchOverlayComponent implements AfterViewInit {
//   foodService = inject(FoodService);
//   fb = inject(NonNullableFormBuilder);
//   effects = inject(RxEffects);
//   state: RxState<{
//     isFoodSearchOpen: boolean,
//     queried: SearchResponse,
//   }> = inject(RxState);
//
//   @ViewChild(CdkConnectedOverlay) cdkConnectedOverlay!: CdkConnectedOverlay;
//   @ViewChild(TextInputComponent) searchInput!: TextInputComponent;
//
//   @Input() parts: Array<keyof SearchResponse> = ['foods'];
//   @Input() overlayOrigin!: CdkOverlayOrigin;
//
//   @Output() itemSelected = new EventEmitter<SearchResult<'recipes' | 'foods' | 'batchRecipes'>>();
//   @Output() escapeKeydown = new EventEmitter<void>();
//
//   protected onResultSelect(result: SearchResult<'recipes' | 'foods' | 'batchRecipes'>): void {
//     this.itemSelected.emit(result);
//   }
//
//   searchControl = this.fb.control('');
//
//   positionPairs: ConnectionPositionPair[] = [
//     {
//       offsetX: 0,
//       offsetY: 0,
//       originX: 'end',
//       originY: 'center',
//       overlayX: 'start',
//       overlayY: 'center',
//     },
//     {
//       offsetX: 0,
//       offsetY: 0,
//       originX: 'end',
//       originY: 'center',
//       overlayX: 'start',
//       overlayY: 'top',
//     },
//     {
//       offsetX: 0,
//       offsetY: 0,
//       originX: 'end',
//       originY: 'center',
//       overlayX: 'start',
//       overlayY: 'bottom',
//     },
//   ];
//
//   detach$ = new Subject<void>();
//
//   constructor() {
//     this.state.set({ isFoodSearchOpen: false });
//
//     this.state.connect('isFoodSearchOpen', this.detach$.pipe(
//       map(() => false),
//     ));
//   }
//
//   ngOnInit(): void {
//     this.state.connect('queried', merge(
//       this.searchControl.valueChanges,
//       // of('bread honey pie waffle snacks'),
//     ).pipe(
//       distinctUntilChanged(),
//       debounceTime(400),
//       filter(name => !!name),
//       switchMap(name => {
//         return this.foodService.search$(name!, this.parts);
//       }),
//       tap(() => {
//         setTimeout(() => {
//           // In here, we guarentee that data will be reflected in the view
//           this.cdkConnectedOverlay.overlayRef.updatePosition();
//         }, 0);
//       })
//     ));
//   }
//
//   ngAfterViewInit(): void {
//     this.effects.register(this.state.select('isFoodSearchOpen').pipe(
//       tap(isFoodSearchOpen => {
//         if (isFoodSearchOpen) {
//           setTimeout(() => {
//             // In here, we guarentee that data will be reflected in the view
//             this.searchInput.focus();
//             this.cdkConnectedOverlay.overlayRef.updatePosition();
//           }, 0);
//         }
//       }),
//     ));
//
//     this.state.connect('isFoodSearchOpen', fromEvent<MouseEvent>(document, 'click').pipe(
//       withLatestFrom(this.state.select('isFoodSearchOpen')),
//       map(([e, isFoodSearchOpen]) => {
//         const clickTarget = e.target as HTMLElement;
//         try {
//           const hasClickedButton = this.overlayOrigin.elementRef.nativeElement.contains(clickTarget) ?? false;
//           const hasClickedOverlay = (
//             !!this.cdkConnectedOverlay.overlayRef &&
//             (this.cdkConnectedOverlay.overlayRef.overlayElement.contains(clickTarget) ?? false)
//           );
//           if (hasClickedButton) {
//             return !isFoodSearchOpen;
//           }
//           return hasClickedOverlay;
//         } catch {
//           return false;
//         }
//       }),
//     ));
//
//     this.effects.register(this.cdkConnectedOverlay.overlayKeydown.pipe(
//       filter(event => event.key === 'Escape'),
//       tap(() => this.escapeKeydown.emit()),
//     ));
//   }
// }
