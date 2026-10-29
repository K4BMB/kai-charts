import { Routes } from '@angular/router';
import { Playground } from './playground/playground';
import { Showcase } from './showcase/showcase';

export const routes: Routes = [
  { path: '', component: Showcase, title: 'kai-charts · demo Angular' },
  { path: 'playground', component: Playground, title: 'kai-charts · playground Angular' },
  { path: '**', redirectTo: '' },
];
