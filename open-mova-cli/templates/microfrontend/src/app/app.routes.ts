import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, Routes } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a routerLink="first-route">First route</a>
      <a routerLink="second-route">Second route</a>
    </nav>
    <router-outlet />
  `,
})
export class __MF_CLASS_NAME__LayoutComponent {}

@Component({
  standalone: true,
  template: `
    <h1>__MF_DISPLAY_NAME__</h1>
    <p>Primera ruta del microfrontal.</p>
  `,
})
export class __MF_CLASS_NAME__FirstRouteComponent {}

@Component({
  standalone: true,
  template: `
    <h1>__MF_DISPLAY_NAME__ · second route</h1>
    <p>Segunda ruta del microfrontal.</p>
  `,
})
export class __MF_CLASS_NAME__SecondRouteComponent {}

// Estas rutas se montan debajo de la ruta pública que define la aplicación.
export const routes: Routes = [
  {
    path: '',
    component: __MF_CLASS_NAME__LayoutComponent,
    children: [
      { path: '', redirectTo: 'first-route', pathMatch: 'full' },
      { path: 'first-route', component: __MF_CLASS_NAME__FirstRouteComponent },
      { path: 'second-route', component: __MF_CLASS_NAME__SecondRouteComponent },
    ],
  },
];
