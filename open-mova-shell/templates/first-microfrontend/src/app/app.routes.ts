import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Routes } from '@angular/router';

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
export class FirstLayoutComponent {}

@Component({
  standalone: true,
  template: `
    <h1>First microfrontend</h1>
    <p>Contenido de la primera aplicación.</p>
  `,
})
export class FirstRouteComponent {}

@Component({
  standalone: true,
  template: `
    <h1>First microfrontend · second route</h1>
    <p>Segunda ruta interna del primer microfrontal.</p>
  `,
})
export class SecondRouteComponent {}

// Estas rutas se cargan dentro de la ruta principal del microfrontal.
export const routes: Routes = [
  {
    path: '',
    component: FirstLayoutComponent,
    children: [
      { path: '', redirectTo: 'first-route', pathMatch: 'full' },
      { path: 'first-route', component: FirstRouteComponent },
      { path: 'second-route', component: SecondRouteComponent },
    ],
  },
];
