import { ChangeDetectionStrategy, Component, inject, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { Subject, tap, withLatestFrom, filter, map, startWith } from 'rxjs';
import { DpDatePickerModule, IDatePickerDirectiveConfig } from 'ng2-date-picker';
import { DayService } from '../services/day.service';
import { Wrapped } from '../util/wrap';
import { BeDirective } from '../directives/let.directive';
import { ActiveDayService } from '../services/active-day.service';
import { stringToDate } from '../util/string-to-date';
import { dateToString } from '../util/date-to-string';
import { MealComponent } from './meal.component';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { AddMealDialogComponent } from './add-meal-dialog.component';
import { MealOnDay } from '../models/meal-on-day';
import { RxEffects } from '@rx-angular/state/effects';
import { NutrientViewModel } from 'src/app/nutrients/models/nutrient-view-model';
import { Day } from '../models/day';
import { foodToNutrientViewModels, recipeToNutrientViewModels } from 'src/app/food-on-recipe/util/get-food-on-recipe-nutrients';
import { aggregateNutrients } from 'src/app/nutrients/util/aggregate-nutrients';
import { calorieName, carbohydrateName, CoreNutrient, coreNutrients, fatName, proteinName } from 'src/app/nutrients/models/core-nutrients';
import { resolveFractional } from 'src/app/food-on-recipe/util/resolve-fractional';
import { ClipboardService, ItemSelection } from '../services/clipboard.service';
import { CoreNutrientsComponent } from "../../nutrients/core-nutrients.component";
import { Platform } from '@angular/cdk/platform';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-dashboard',
    providers: [RxState, RxEffects],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './dashboard.component.html',
    imports: [CommonModule, RouterModule, ReactiveFormsModule,
      DpDatePickerModule, BeDirective, MealComponent, DialogModule,
      CoreNutrientsComponent],
})
export class DashboardComponent {
  platform = inject(Platform);
  dialog = inject(Dialog);
  fb = inject(NonNullableFormBuilder);
  dayService = inject(DayService);
  activeDayService = inject(ActiveDayService);
  clipboardService = inject(ClipboardService);
  authService = inject(AuthService);

  effects = inject(RxEffects);
  state: RxState<{
    day: string,
    dayResponse: Wrapped<Day>,
    nutrients: Omit<NutrientViewModel, 'nutrientId'>[],
    days: any[],
    clipboard: ItemSelection | null,
    nutrientGoals: Array<{ nutrient: CoreNutrient, goal: number }>,
  }> = inject(RxState);

  onDayMutate$ = new Subject<{ offset: number }>();
  onAddMealToDay$ = new Subject<void>();
  onClipboardClear$ = new Subject<void>();

  dayControl = this.fb.control('');
  config: IDatePickerDirectiveConfig = { format: 'YYYY-MM-DD' };
  trackByMeal: TrackByFunction<MealOnDay> = (_, mealOnDay) => mealOnDay.mealId;

  protected nutrientNames: Record<string, string> = {
    [calorieName]: 'Calories',
    [proteinName]: 'Protein',
    [carbohydrateName]: 'Carbs',
    [fatName]: 'Fat',
  };

  constructor() {
    this.effects.register(this.onClipboardClear$.pipe(
      tap(() => {
        this.clipboardService.clear();
      }),
    ));

    this.state.connect('day', this.activeDayService.day$);
    this.state.connect('dayResponse', this.activeDayService.dayResponse$);

    this.state.connect('clipboard', this.clipboardService.clipboard$);

    this.state.connect('days', this.activeDayService.day$.pipe(
      map(() => {
        return [];
      }),
      startWith([]),
    ));

    this.effects.register(this.onDayMutate$.pipe(
      withLatestFrom(this.state.select('day')),
      tap(([{ offset }, day]) => {
        const offsettedDay = (() => {
          const date = stringToDate(day);
          date.setDate(date.getDate() + offset);
          return dateToString(date);
        })();
        this.activeDayService.setDay.next({ day: offsettedDay });
      }),
    ));

    this.effects.register(this.dayControl.valueChanges.pipe(
      withLatestFrom(this.state.select('day')),
      filter(([incomingDay, currentDay]) => currentDay !== incomingDay),
      tap(([incomingDay]) => {
        this.activeDayService.setDay.next({ day: incomingDay });
      }),
    ));

    this.effects.register(this.state.select('day').pipe(
      filter((incomingDay) => this.dayControl.getRawValue() !== incomingDay),
      tap((incomingDay) => {
        this.dayControl.setValue(incomingDay);
      }),
    ));

    // =========================================================================

    const isMobile = this.platform.IOS && this.platform.ANDROID;

    this.effects.register(this.onAddMealToDay$.pipe(
      withLatestFrom(this.state.select('day')),
      tap(([_, day]) => {
        this.dialog.open(AddMealDialogComponent, {
          minWidth: '300px',
          data: { day },
          autoFocus: isMobile ? false : true,
        });
      }),
    ));

    this.state.connect('nutrients', this.state.select('dayResponse'), (state, day) => {
      let nutrients: NutrientViewModel[] = [];

      if (day.data) {
        const dayNutrients = day.data.mealsOnDays.map(mealOnDay => {

          const foodsOnMealNutrients = mealOnDay.meal.foodsOnMeals.map(foodOnMeal => {
            const resolved = resolveFractional({
              scaleBase: foodOnMeal.scaleBase,
              scaleDenominator: foodOnMeal.scaleDenominator,
              scaleNumerator: foodOnMeal.scaleNumerator,
              scaleDecimal: foodOnMeal.scaleDecimal,
              shouldUseScaleDecimal: foodOnMeal.shouldUseScaleDecimal,
              halves: foodOnMeal.halves,
              thirds: foodOnMeal.thirds,
              fourths: foodOnMeal.fourths,
              sixths: foodOnMeal.sixths,
              eighths: foodOnMeal.eighths,
              sixteenths: foodOnMeal.sixteenths,
            });
            return foodToNutrientViewModels(foodOnMeal.food, foodOnMeal.foodUnit, resolved);
          })
            .flat();

          const recipesOnMealNutrients = mealOnDay.meal.recipesOnMeals.map(recipeOnMeal => {
            return recipeToNutrientViewModels(recipeOnMeal.recipe);
          })
            .flat();

          return [...foodsOnMealNutrients, ...recipesOnMealNutrients];
        })
          .flat();

        const agg = aggregateNutrients(dayNutrients)
          .filter(nutrient => coreNutrients.includes(nutrient.name as CoreNutrient));
        nutrients = [...agg];
      }

      return nutrients;
    });

    this.state.connect('nutrientGoals', this.authService.settings$.pipe(
      map((settings) => {
        const goals = [];

        if (settings.dailyTargetProtein) {
          goals.push({ nutrient: proteinName, goal: settings.dailyTargetProtein });
        }
        if (settings.dailyTargetCalories) {
          goals.push({ nutrient: calorieName, goal: settings.dailyTargetCalories });
        }
        if (settings.dailyTargetCarbohydrates) {
          goals.push({ nutrient: carbohydrateName, goal: settings.dailyTargetCarbohydrates })
        }
        if (settings.dailyTargetFat) {
          goals.push({ nutrient: fatName, goal: settings.dailyTargetFat });
        }
        return goals;
      }),
    ))
  }
}


