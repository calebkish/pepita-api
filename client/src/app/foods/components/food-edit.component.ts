import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Food, FoodService } from '../services/food.service';
import { RxState } from '@rx-angular/state';
import { ActivatedRoute } from '@angular/router';
import { Subject, switchMap, map } from 'rxjs';
import { FieldBase } from 'src/app/dynamic-form/models/field-base';
import { TextboxField } from 'src/app/dynamic-form/models/textbox-field';
import { Validators } from '@angular/forms';
import { BeDirective } from 'src/app/_shared/directives/let.directive';

@Component({
  selector: 'app-food-edit',
  standalone: true,
  template: `
    <ng-container *appBe="state.select() | async as vm">
      <pre>
        <!-- {{ vm.food | json }} -->
      </pre>
      <!-- <app-dynamic-form *ngIf="vm?.fields as fields" [fields]="fields"></app-dynamic-form> -->
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  imports: [CommonModule, BeDirective],
})
export class FoodEditComponent {
  private readonly foodService = inject(FoodService);
  private readonly activatedRoute = inject(ActivatedRoute);
  protected readonly state: RxState<{
    food: Food,
    fields: FieldBase[],
  }> = inject(RxState);

  protected readonly onSubmit = new Subject<any>();

  constructor() {
    this.state.connect('food', this.activatedRoute.params.pipe(
      switchMap(params => {
        return this.foodService.getFood$(params['foodId']);
      }),
    ));

    this.state.connect('fields', this.state.select('food').pipe(
      map(food => {
        return [
          new TextboxField({
            key: 'name',
            label: 'Name',
            validators: [Validators.required],
            order: 1
          }),
          new TextboxField({
            key: '',
            label: 'Password',
            type: 'password',
            validators: [Validators.required],
            order: 2,
          }),
        ];
      })
    ));
  }
}
