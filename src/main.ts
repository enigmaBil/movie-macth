import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { addIcons } from 'ionicons';
import { camera, cameraOutline, chevronForward, heart, heartCircle, heartDislike, heartDislikeCircleOutline, heartOutline, home, lockClosed, logOutOutline, mail, person, personCircle, personCircleOutline } from 'ionicons/icons';

addIcons({ home});
addIcons({ heart });
addIcons({ heartOutline });
addIcons({ person });
addIcons({ lockClosed });
addIcons({ logOutOutline });
addIcons({ camera });
addIcons({ chevronForward });
addIcons({ mail });
addIcons({ heartDislikeCircleOutline });

// Register Ionic PWA Elements (web components) if available.
// This improves the camera/file input UI when running as a PWA in the browser.
// dynamic import so this only runs if the package is installed
import('@ionic/pwa-elements/loader')
  .then((loader) => {
    if (loader && typeof loader.defineCustomElements === 'function') {
      // define the custom elements on the window
      return loader.defineCustomElements(window as any);
    }
    return Promise.resolve();
  })
  .catch(() => {
    // ignore if the package isn't installed or import fails
  });

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    ...appConfig.providers
  ],
});
