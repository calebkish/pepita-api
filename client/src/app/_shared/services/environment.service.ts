import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  get apiHost() {
    return environment.apiHost;
  }
  get production() {
    return environment.production;
  }
}
