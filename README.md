# Development
* `npx prisma migrate dev --name add_job_title`
* `npx prisma studio`

# Production
* `npx prisma migrate deploy`
    * Should be part of CI/CD pipeline
    * `https://www.prisma.io/docs/guides/deployment/deploy-database-changes-with-prisma-migrate`


# TODO

* Import branded foods

* Why would a user create a custom Food?
    * It doesn't exist from USDA entries, but there's some other source where it
      can be grabbed from e.g. online or from a food label.

## Initial custom Food create

name: string
category?: ID

carbs: number
protein: number
fats: number

serving size amount: number
serving unit: enter a custom name w/ autocomplete for `Unit`s
select allowed divisions

Add a button to "normalize" the nutrients where serving size amount is 1.

gramWeight?

If gramWeight is removed, show a confirmation modal like "If gramWeight is
removed, you'll be unable to use added additional units"

### Add FoodUnit
Requires gramWeight -- keep this section disabled until gramWeight is added.

serving size amount: number
serving unit: Select from a Unit or enter a custom name
gramWeight: number
select allowed divisions


## Add recipe




## Settings
* Nutrition Targets (calories, protein, carbs, fat)
* Default meals when a day is created
* Default divisions on `Unit`s


## Publishing
* Foods
* Recipes
* Plans



await prismaClient.$transaction(async (tx) => { });
