import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { EnvironmentService } from "./environment.service";

@Injectable({ providedIn: 'root' })
export class MealService {
  private readonly client = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  deleteMeal$(mealId: string): Observable<any> {
    return this.client.delete<any>(`${this.env.apiHost}/meal/${mealId}`);
  }
}
