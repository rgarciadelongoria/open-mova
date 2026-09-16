import type { Routes } from '@angular/router';
import { CAPABILITY_CATALOG } from './capabilities/capability-catalog';
import { DemoLayoutComponent } from './layout/demo-layout.component';
import { CapabilityPageComponent } from './pages/capability/capability-page.component';
import { HomeComponent } from './pages/home/home.component';

// Las rutas solo conectan URLs con componentes; cada pantalla vive en su propio fichero.
export const routes: Routes = [
  {
    path: '',
    component: DemoLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: HomeComponent },
      ...CAPABILITY_CATALOG.map((capability) => ({
        path: capability.id,
        component: CapabilityPageComponent,
        data: { capability },
      })),
    ],
  },
];
