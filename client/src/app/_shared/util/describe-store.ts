import { inject, Injectable } from "@angular/core";
import { RxState } from "@rx-angular/state";

export function describeStore<STATE extends Record<string, unknown>>(
  initialState: STATE,
) {
  @Injectable()
  class Store extends RxState<STATE> {
    constructor() {
      super();
      this.set(initialState);
    }
  }

  return {
    provideStore() {
      return [Store];
    },
    injectStore() {
      return inject<Store>(Store, { self: true });
    },
  };
}
