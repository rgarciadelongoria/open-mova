import { Routes } from '@angular/router';
import { DemoLayoutComponent } from './layout/demo-layout.component';
import { CameraExampleComponent } from './pages/camera/camera-example.component';
import { DeviceExampleComponent } from './pages/device/device-example.component';
import { HomeComponent } from './pages/home/home.component';

// Las rutas solo conectan URLs con componentes; cada pantalla vive en su propio fichero.
export const routes: Routes = [
  {
    path: '',
    component: DemoLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: HomeComponent },
      { path: 'device', component: DeviceExampleComponent },
      { path: 'camera', component: CameraExampleComponent },
    ],
  },
];
