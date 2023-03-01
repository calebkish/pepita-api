import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Day } from "../models/day";
import { EnvironmentService } from "./environment.service";
import { AddMealToDayRequest } from "../models/requests/add-meal-to-day";
import { EntityCache } from "../util/entity-cache";

@Injectable({ providedIn: 'root' })
export class DayService extends EntityCache<Day> {
  private readonly client = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  constructor() {
    const refetcher = (entityKey: string) => {
      return this.client.get<Day>(`${this.env.apiHost}/day/${entityKey}`)
    };
    super(refetcher);
  }

  createBlankDay$(day: string): Observable<Day> {
    return this.client.post<Day>(`${this.env.apiHost}/day/${day}`, {});
  }

  createDayWithMealTemplates$(day: string): Observable<Day> {
    return this.client.post<Day>(`${this.env.apiHost}/day/${day}`, {
      shouldAddMealTemplates: true
    });
  }

  addMealToDay$(day: string, body: AddMealToDayRequest): Observable<any> {
    return this.client.post<any>(`${this.env.apiHost}/day/${day}/meal`, body);
  }
}
