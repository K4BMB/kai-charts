import { Routes } from '@angular/router';
import { Showcase } from './showcase/showcase';

export const routes: Routes = [
  { path: '', component: Showcase, title: 'kai-charts · demo Angular' },
  // `#/playground` keeps working: it opens the bar sandbox.
  { path: 'playground', redirectTo: 'playground/bar', pathMatch: 'full' },
  {
    path: 'playground/:chart',
    // Lazy: the nine sandboxes and their editors stay out of the initial bundle.
    loadComponent: () => import('./playground/playground').then((m) => m.Playground),
    title: 'kai-charts · playground Angular',
  },
  { path: '**', redirectTo: '' },
];
