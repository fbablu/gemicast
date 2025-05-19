import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDrTRNc6bh0W3kEwTHLQPlXo1VL_6Kjn9Y',
  authDomain: 'gemicast-eac3e.firebaseapp.com',
  projectId: 'gemicast-eac3e',
  storageBucket: 'gemicast-eac3e.firebasestorage.app',
  messagingSenderId: '206031573739',
  appId: '1:206031573739:web:5367867a48d4a0db0764ae',
  measurementId: 'G-0SB35Y09GH',
};

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app;
  private firestore: Firestore;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.firestore = getFirestore(this.app);
  }

  getFirestore(): Firestore {
    return this.firestore;
  }
}
