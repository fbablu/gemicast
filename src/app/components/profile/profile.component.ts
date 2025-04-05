import { Component } from '@angular/core';
import { initializeApp } from '@firebase/app';
import { getFirestore, collection, addDoc } from '@firebase/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const firebaseConfig = {
  apiKey: 'AIzaSyD1TfLL2Sdfomsf1y_W1AGBW_SNPuKkic',
  authDomain: 'voltennplatform.firebaseapp.com',
  projectId: 'voltennplatform',
  storageBucket: 'voltennplatform.appspot.com',
  messagingSenderId: '716984580244',
  appId: '1:716984580244:web:2e37973cab597e7bf39259',
  measurementId: 'G-9YSSLP8S69',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Component({
  selector: 'app-profile',
  imports: [FormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  phoneNumber: string = '';

  //tracks the state of the check box
  receiveTexts: boolean = false;

  async savePhoneNumber() {
    if (!this.phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'phoneNumbers'), {
        phone: this.phoneNumber,
        //save check box value to Firestore
        receiveTexts: this.receiveTexts,
        timestamp: new Date(),
      });
      console.log('Phone number saved with ID:', docRef.id);
      alert('Phone number saved!');
      this.phoneNumber = '';
      this.receiveTexts = false;
    } catch (e) {
      console.error('Error saving phone number:', e);
      alert('Something went wrong.');
    }
  }
}
