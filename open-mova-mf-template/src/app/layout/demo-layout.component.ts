import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CAPABILITY_CATALOG } from '../capabilities/capability-catalog';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './demo-layout.component.html',
  styleUrl: './demo-layout.component.css',
  // Los estilos deben viajar con el remoto y aplicarse también a sus rutas hijas.
  encapsulation: ViewEncapsulation.None,
})
export class DemoLayoutComponent {
  readonly capabilities = CAPABILITY_CATALOG;
}
