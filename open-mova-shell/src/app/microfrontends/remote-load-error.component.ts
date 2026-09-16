import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'mova-remote-load-error',
  standalone: true,
  styles: `
    :host {
      box-sizing: border-box;
      display: block;
      font-family: system-ui, sans-serif;
      margin: 3rem auto;
      max-width: 48rem;
      padding: 1.5rem;
    }

    section {
      border: 1px solid #dc2626;
      border-radius: 0.75rem;
      color: #7f1d1d;
      padding: 1.25rem;
    }
  `,
  template: `
    <section role="alert">
      <h1>No se puede cargar el microfrontal</h1>
      <p>{{ message }}</p>
    </section>
  `,
})
export class RemoteLoadErrorComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly message =
    this.route.snapshot.data['message'] ?? 'Se ha producido un error desconocido.';
}
