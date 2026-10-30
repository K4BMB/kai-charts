import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash URLs (`#/playground`) work on static hosts such as GitHub Pages without rewrites.
    // Input binding feeds the `:chart` param to the Playground `chart` input.
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
  ],
};
