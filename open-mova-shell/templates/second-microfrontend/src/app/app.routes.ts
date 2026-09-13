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
export class SecondLayoutComponent {}

@Component({
  standalone: true,
  template: `
    <h1>Second microfrontend</h1>
    <p>Contenido de la segunda aplicación.</p>
  `,
})
export class FirstRouteComponent {}

@Component({
  standalone: true,
  template: `
    <h1>Second microfrontend · second route</h1>
    <p>Segunda ruta interna del segundo microfrontal.</p>
  `,
})
export class SecondRouteComponent {}

// Cada microfrontal es dueño de sus rutas internas.
export const routes: Routes = [
  {
    path: '',
    component: SecondLayoutComponent,
    children: [
      { path: '', redirectTo: 'first-route', pathMatch: 'full' },
      { path: 'first-route', component: FirstRouteComponent },
      { path: 'second-route', component: SecondRouteComponent },
    ],
  },
];
