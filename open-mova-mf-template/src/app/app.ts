import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'mova-demo-microfrontend',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
