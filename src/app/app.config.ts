import { ApplicationConfig } from "@angular/core";
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from "@angular/router";
import { provideFirebaseApp, initializeApp } from "@angular/fire/app";
import { provideFirestore, getFirestore } from "@angular/fire/firestore";
import { provideStorage, getStorage } from "@angular/fire/storage";
import { provideAuth, getAuth } from "@angular/fire/auth";
import { routes } from "./app.routes";
import { environment } from "src/environments/environment";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        provideAuth(() => getAuth()),
    ]
};