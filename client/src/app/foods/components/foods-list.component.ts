import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Food, FoodService } from '../services/food.service';
import { RouterModule } from '@angular/router';
import { RxState } from '@rx-angular/state';

@Component({
  selector: 'app-foods-list',
  imports: [CommonModule, RouterModule],
  template: `
<div class="flex flex-col gap-8 max-w-lg mx-auto p-5">
  <button class="btn btn-primary" routerLink="/foods/create">Create</button>
  <h1 class="text-lg">Foods</h1>
  <ul class="flex flex-col" *ngIf="state.select('foods') | async as foods">
    <li class="flex justify-between p-3 bg-gray-100" *ngFor="let food of foods">
      <a class="" routerLink="/foods/{{ food.id }}">{{ food.name }}</a>
      <div class="flex gap-2">
        <!-- <p>{{ food.calories }}</p> -->
        <!-- <p>{{ food.protein }}</p> -->
        <!-- <p>{{ food.carbohydrates }}</p> -->
        <!-- <p>{{ food.fat }}</p> -->
      </div>
    </li>
  </ul>
</div>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class FoodsListComponent {
  private readonly foodService = inject(FoodService);
  protected readonly state: RxState<{
    foods: Food[]
  }> = inject(RxState);

  constructor() {
    this.state.connect('foods', this.foodService.getFoods$());
  }
}
