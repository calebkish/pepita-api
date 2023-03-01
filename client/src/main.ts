import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { enableProdMode, ENVIRONMENT_INITIALIZER, importProvidersFrom, inject, Provider } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/routes';
import { AuthService } from './app/_shared/services/auth.service';
import { provideAnimations } from '@angular/platform-browser/animations';

import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

export function attachInitEffect(fn: VoidFunction): Provider {
  return {
    multi: true,
    provide: ENVIRONMENT_INITIALIZER,
    useValue: fn,
  };
}

const GLOBAL_INIT = attachInitEffect(() => {
  inject(AuthService);
});

bootstrapApplication(AppComponent, {
  providers: [
    GLOBAL_INIT,
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(CommonModule),
    provideAnimations(),
  ],
})
  .catch(err => console.error(err));
