import { Injectable, inject, Injector, runInInjectionContext, NgZone } from '@angular/core';
import { Auth, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import type { User } from '../models/user.model';

type CameraResult = { dataUrl?: string } | null;

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private zone = inject(NgZone);
  private injector = inject(Injector);

  constructor() {}

  async takePhotoFallback(): Promise<string | null> {
    try {
      const mod = await import('@capacitor/camera');
      const Camera = (mod as any).Camera;
      if (!Camera?.getPhoto) return null;
      const res: any = await Camera.getPhoto({
        quality: 80,
        resultType: 'dataUrl',
        source: 'CAMERA',
      });
      return res?.dataUrl ?? null;
    } catch (e) {
      return null;
    }
  }

  async pickPhotoFallback(): Promise<string | null> {
    try {
      const mod = await import('@capacitor/camera');
      const Camera = (mod as any).Camera;
      if (!Camera?.getPhoto) return null;
      const res: any = await Camera.getPhoto({
        quality: 80,
        resultType: 'dataUrl',
        source: 'PHOTOS',
      });
      return res?.dataUrl ?? null;
    } catch (e) {
      return null;
    }
  }

  async uploadProfilePhoto(uid: string, dataUrl: string, fileName = 'profile.jpg') {
    return this.zone.runOutsideAngular(async () => {
      const approxSize = dataUrl.length; // characters — rough proxy

      const MAX_FIRESTORE_FIELD_CHARS = 900000; // conservative limit

      // Try uploading to Storage first. If that fails (CORS/billing/etc.), fallback to Firestore.
      try {
        const path = `profilePhotos/${uid}/${fileName}`;
        const storageRef = ref(this.storage, path);
        await uploadString(storageRef, dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
      } catch (storageErr) {
        console.warn('Storage upload failed, falling back to Firestore user doc:', storageErr);

        // If dataUrl is too big to safely store in Firestore, rethrow the storage error so the caller can handle it.
        if (approxSize > MAX_FIRESTORE_FIELD_CHARS) {
          throw new Error('Image too large to store in Firestore fallback. Please reduce image size or enable Storage.');
        }

        // Save the dataUrl directly in the user's Firestore document under `photoDataUrl`.
        try {
          const userRef = doc(this.firestore, 'users', uid);
          await setDoc(userRef as any, { photoDataUrl: dataUrl }, { merge: true } as any);
          // Return the dataUrl so callers can use it as the photo URL/preview
          return dataUrl;
        } catch (fireErr) {
          console.error('Failed to save photo data URL to Firestore fallback:', fireErr);
          throw fireErr;
        }
      }
    });
  }

  // Update Firestore user doc and Auth profile with provided fields
  async updateProfileData(uid: string, updates: Partial<User & { photoURL?: string }>) {
    return this.zone.runOutsideAngular(async () => {
      const userRef = doc(this.firestore, 'users', uid);
      const payload: any = { ...updates };
      // remove undefined fields
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      await updateDoc(userRef as any, payload).catch(async (err) => {
        // if update fails because doc doesn't exist, create it
        await setDoc(userRef as any, payload, { merge: true } as any);
      });

      // Update Firebase Auth profile if needed (displayName, photoURL)
      const current = this.auth.currentUser;
      if (current) {
        const authPayload: any = {};
        if (updates.firstName || updates.lastName) {
          const first = (updates.firstName ?? (current.displayName?.split(' ')[0] ?? ''));
          const last = (updates.lastName ?? (current.displayName?.split(' ').slice(1).join(' ') ?? ''));
          authPayload.displayName = `${first} ${last}`.trim();
        }
        if ((updates as any).photoURL) authPayload.photoURL = (updates as any).photoURL;
        if (Object.keys(authPayload).length) {
          await updateProfile(current, authPayload as any);
        }
      }
      return true;
    });
  }

  // Helper to convert a File to dataUrl (for file input fallback)
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }
}
