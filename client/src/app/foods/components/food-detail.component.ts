import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { Food, FoodService } from '../services/food.service';
import { RxState } from '@rx-angular/state';

@Component({
  selector: 'app-food-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="state.select('food') | async as food">
      <p class="text-2xl">{{food.name}}</p>
      <a routerLink="/food/{{food.id}}/edit">Edit</a>
      <p>Base unit amount: {{food.baseUnitAmount}}</p>
      <!-- <p>Calories: {{food.calories}}</p> -->
      <!-- <p>Protein: {{food.protein}}</p> -->
      <!-- <p>Carbohydrates: {{food.carbohydrates}}</p> -->
      <!-- <p>Fat: {{food.fat}}</p> -->
      <!-- Do something with food.foodUnits later -->
    </ng-container>

    <a routerLink="">Go back</a>
  `,
  providers: [RxState],
})
export class FoodDetailComponent {
  private readonly foodService = inject(FoodService);
  private readonly activatedRoute = inject(ActivatedRoute);
  protected readonly state: RxState<{
    food: Food,
  }> = inject(RxState);

  constructor() {
    this.state.connect('food', this.activatedRoute.params.pipe(
      switchMap(params => {
        return this.foodService.getFood$(params['foodId']);
      }),
    ));
  }
}
