// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyBK41X7t7XR_Ls-E53f7AcPkq51VE8crhk",
    authDomain: "movie-match-f6df1.firebaseapp.com",
    projectId: "movie-match-f6df1",
    storageBucket: "movie-match-f6df1.firebasestorage.app",
    messagingSenderId: "272940525447",
    appId: "1:272940525447:web:5f4fb6884fa56078cfd522",
    measurementId: "G-KERTRSZXNZ"
  },
  tmdb: {
    apiKey: "fb28e7a7c915880df0c55db351d059ce",
    baseUrl: "https://api.themoviedb.org/3",
    posterUrl: "https://image.tmdb.org/t/p/w500"
  },
  url: process.env['NG_APP_BASE_URL']
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
