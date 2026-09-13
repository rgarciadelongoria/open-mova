import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'mova-root',
  standalone: true,
  imports: [RouterOutlet],
  // La shell solo ofrece el punto donde se montan las rutas remotas.
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {}
