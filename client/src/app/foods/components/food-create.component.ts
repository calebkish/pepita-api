import { ChangeDetectionStrategy, Component, inject, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { tap, Subject, map, switchMap, filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { RxState } from '@rx-angular/state';
import { TextInputComponent } from "../../dynamic-form/components/text-input.component";
import { SelectInputComponent, SelectOption } from "../../dynamic-form/components/select-input.component";
import { Food, FoodService } from '../services/food.service';
import { NumberInputComponent } from "../../dynamic-form/components/number-input.component";
import { AutocompleteInputComponent } from "../../dynamic-form/components/autocomplete-input.component";
import { RouterModule } from '@angular/router';
import { customValidator, requiredValidator } from 'src/app/dynamic-form/util/has-gram-validator';
import { SubmitButtonComponent } from "../../dynamic-form/components/submit-button.component";
import { toTitleCase } from 'src/app/_shared/util/to-title-case';
import { BeDirective } from 'src/app/_shared/directives/let.directive';

@Component({
  selector: 'app-food-create',
  standalone: true,
  templateUrl: './food-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  imports: [
    CommonModule, ReactiveFormsModule, TextInputComponent,
    SelectInputComponent, NumberInputComponent, AutocompleteInputComponent,
    RouterModule, SubmitButtonComponent, BeDirective
  ],
})
export class FoodCreateComponent {
  protected readonly fb = inject(NonNullableFormBuilder);
  protected readonly foodService = inject(FoodService);
  protected readonly state: RxState<{
    categoryOptions: SelectOption<string>[],
    queried: Food[],
    foodUnits: any[],
    gramWeightHasValue: boolean,
  }> = inject(RxState);

  // Actions
  protected readonly onSubmit$ = new Subject<void>();
  protected readonly onFoodUnitAdd$ = new Subject<void>();
  protected readonly onFoodUnitRemove$ = new Subject<number>();

  protected readonly primaryNutrientControls = primaryNutrientControls;
  protected readonly nutrientControls = nutrientControls;
  protected readonly foodUnitTrackBy: TrackByFunction<any> = index => index;
  protected readonly form = this.fb.group({
    name: this.fb.control('', { validators: [requiredValidator], updateOn: 'change' }),
    category: this.fb.control(''),
    servingUnitAmount: this.fb.control('1', [requiredValidator]),
    servingUnitName: this.fb.control('', [requiredValidator, hasGramValidator]),
    gramWeight: this.fb.control('', { updateOn: 'change' }),
    foodUnits: this.fb.array<{ servingUnitAmount: string, servingUnitName: string, gramWeight: string }>([]),
    ...this.primaryNutrientControls.reduce((acc, nutrient) => ({
      ...acc,
      [nutrient.formControlName]: this.fb.control('', nutrient.required ? [requiredValidator] : []),
    }), {}),
  }, { updateOn: 'blur' });

  constructor() {
    this.state.set({
      foodUnits: this.form.get('foodUnits')?.value ?? [],
      gramWeightHasValue: false,
    });

    this.state.connect('categoryOptions', this.foodService.getFoodCategories$().pipe(
      map(categories => categories.map(({ name, id }) => ({ name, value: id }))),
    ));

    this.state.connect('queried', this.form.get('name')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(400),
      filter(name => !!name),
      switchMap(name => {
        return this.foodService.search$(name!);
      }),
    ));

    this.state.connect('gramWeightHasValue', this.form.get('gramWeight')!.valueChanges.pipe(
      map(value => {
        const control = this.form.get('gramWeight');
        return !!value && (control?.valid ?? false);
      }),
    ));

    this.state.hold(this.onFoodUnitAdd$.pipe(
      tap(() => {
        const foodUnitsFormArray = this.form.get('foodUnits') as FormArray;
        const newControl = this.fb.group({
          servingUnitAmount: this.fb.control('1', [requiredValidator]),
          servingUnitName: this.fb.control('', [requiredValidator, hasGramValidator]),
          gramWeight: this.fb.control('', [requiredValidator]),
        });
        foodUnitsFormArray.push(newControl);
      }),
    ));

    this.state.hold(this.onFoodUnitRemove$.pipe(
      tap((index) => {
        const foodUnitsFormArray = this.form.get('foodUnits') as FormArray;
        foodUnitsFormArray.removeAt(index);
      }),
    ));

    this.state.connect('foodUnits', this.form.get('foodUnits')!.valueChanges);

    this.state.hold(this.onSubmit$.pipe(
      tap(() => {
        if (!this.form.valid) {
          console.log('not valid');
          return;
        }

        console.log(this.form.value);
      }),
    ));
  }

  ngOnInit(): void {
    // const foodUnitsFormArray = this.form.get('foodUnits') as FormArray;
    // const newControl = this.fb.group({
    //   servingUnitAmount: this.fb.control('1', [requiredValidator]),
    //   servingUnitName: this.fb.control('', [requiredValidator, hasGramValidator]),
    //   gramWeight: this.fb.control('', [requiredValidator]),
    // });
    // foodUnitsFormArray.push(newControl);
    // this.form.setValue({
    //   "name": "salmon",
    //   "category": "",
    //   "servingUnitAmount": "1",
    //   "servingUnitName": "cup",
    //   "gramWeight": "10",
    //   "foodUnits": [
    //     {
    //       "servingUnitAmount": "1",
    //       "servingUnitName": "cup",
    //       "gramWeight": "10"
    //     }
    //   ],
    //   // @ts-ignore
    //   "calories": "100",
    //   "protein": "",
    //   "carbs": "",
    //   "fat": "",
    // });
  }
}

const hasGramValidator = customValidator('hasGram', 'Do not enter grams', control => {
  if (control.value.length === 0) {
    return false;
  }
  return /gram/.test(control.value);
});

const primaryNutrientControls = [
  getNutrientControlConfig('calories', { postfixLabel: 'kcal', required: true }),
  getNutrientControlConfig('protein', { required: true }),
  getNutrientControlConfig('carbs', { required: true }),
  getNutrientControlConfig('fat', { required: true }),
];

const nutrientControls = [
  getNutrientControlConfig('cholesterol'),
  getNutrientControlConfig('sodium'),
  getNutrientControlConfig('sodium'),
  getNutrientControlConfig('fiber'),
  getNutrientControlConfig('vitaminD'),
  getNutrientControlConfig('iron'),
  getNutrientControlConfig('vitaminE'),
  getNutrientControlConfig('calcium'),
  getNutrientControlConfig('potassium'),
  getNutrientControlConfig('niacin'),
];

function getNutrientControlConfig(
  formControlName: string,
  { postfixLabel = 'g', required = false }: { postfixLabel?: string, required?: boolean } = {}
) {
  return {
    formControlName,
    label: toTitleCase(formControlName),
    postfixLabel,
    required,
  }
}



/* @TODO

protein g
carbs g
fat g

fiber g
sodium mg
potassium mg
cholesterol mg

sugar g
sucrose g
glucose g
fructose g
lactose g
maltose g
galactose g

saturated fat g
monounsaturated fat g
polyunsaturated fat g
trans fat g
omega 3 fatty acids g
omega 6 fatty acids g


bretaine mg
caffeine mg
calcium mg
choline mg
copper mg
fluoride ug
folate ug
iron mg
lycopene ug
magnesium mg
manganese mg
niacin mg
phosphorus mg
retinol ug
ribofalvin mg
thiamine mg
selenium
vitamin a
vitamin b6
vitamin b12
vitamin c
vitamin d
vitamin d2
vitamin d3
vitamin e
vitamin k
zinc



Validator that prevents multiple units with the same name (or maybe just rely on the server)

Save this to DB
{
  "name": "salmon",
  "category": "",
  "servingUnitAmount": "1",
  "servingUnitName": "cup",
  "gramWeight": "10",
  "foodUnits": [
    {
      "servingUnitAmount": "1",
      "servingUnitName": "cup",
      "gramWeight": "10"
    }
  ],
  "calories": "100",
  "protein": "",
  "carbs": "",
  "fat": "",
}
*/

