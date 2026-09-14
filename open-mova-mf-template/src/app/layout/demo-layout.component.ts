import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './demo-layout.component.html',
  styleUrl: './demo-layout.component.css',
  // Los estilos deben viajar con el remoto y aplicarse también a sus rutas hijas.
  encapsulation: ViewEncapsulation.None,
})
export class DemoLayoutComponent {}
