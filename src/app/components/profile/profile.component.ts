import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { initializeApp } from '@firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from '@firebase/firestore';

import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD1TfLL2Sdfomsf1y_WlAGBW_SUNPUkKic',
  authDomain: 'voltennplatform.firebaseapp.com',
  databaseURL: 'https://voltennplatform-default-rtdb.firebaseio.com',
  projectId: 'voltennplatform',
  storageBucket: 'voltennplatform.firebasestorage.app',
  messagingSenderId: '716984582044',
  appId: '1:716984582044:web:2e37973cab597e7bf39259',
  measurementId: 'G-9YSSLP8S69',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  adminPhone: string;
}

interface Member {
  phone: string;
  name: string;
  email?: string;
  joinedAt: Date;
  receiveNotifications: boolean;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class ProfileComponent {
  // User info
  phoneNumber: string = '';
  userName: string = '';
  email: string = '';
  receiveTexts: boolean = true;

  // Organization info
  organizations: Organization[] = [];
  selectedOrg: Organization | null = null;
  newOrgName: string = '';
  newOrgDescription: string = '';

  // Organization members
  members: Member[] = [];

  // UI state
  isCreatingOrg: boolean = false;
  isJoiningOrg: boolean = false;
  joinCode: string = '';
  isLoading: boolean = false;
  message: string = '';
  showMessage: boolean = false;
  messageType: 'success' | 'error' = 'success';

  // Sharing info
  shareableLink: string = '';
  showShareLink: boolean = false;

  constructor() {
    // Check if we have saved user info
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
      this.phoneNumber = savedPhone;
      this.loadUserData();
    }

    const auth = getAuth(app);
    signInAnonymously(auth)
      .then((userCredential) => {
        console.log('✅ Signed in as anonymous user:', userCredential.user.uid);
      })
      .catch((error) => {
        console.error('❌ Anonymous sign-in failed:', error);
      });
  }

  async saveUserInfo() {
    if (!this.phoneNumber) {
      this.showErrorMessage('Please enter a phone number');
      return;
    }

    try {
      this.isLoading = true;

      // Save to Firestore
      await setDoc(doc(db, 'users', this.phoneNumber), {
        phone: this.phoneNumber,
        name: this.userName || 'Anonymous User',
        email: this.email || '',
        receiveNotifications: this.receiveTexts,
        updatedAt: new Date(),
      });

      // Save locally
      localStorage.setItem('userPhone', this.phoneNumber);

      this.showSuccessMessage('Profile updated successfully!');

      // Load user's organizations
      this.loadUserOrganizations();
    } catch (e) {
      console.error('Error saving user info:', e);
      this.showErrorMessage('Error saving profile');
    } finally {
      this.isLoading = false;
    }
  }

  async loadUserData() {
    try {
      // Load user data from Firestore
      const userRef = doc(db, 'users', this.phoneNumber);
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('phone', '==', this.phoneNumber)),
      );

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        this.userName = userData['name'] || '';
        this.email = userData['email'] || '';
        this.receiveTexts = userData['receiveNotifications'] !== false; // Default to true
      }

      // Load user's organizations
      this.loadUserOrganizations();
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  }

  async loadUserOrganizations() {
    if (!this.phoneNumber) return;

    try {
      this.isLoading = true;
      this.organizations = [];

      // Get organizations where user is a member
      const membershipDocs = await getDocs(
        query(
          collection(db, 'memberships'),
          where('phone', '==', this.phoneNumber),
        ),
      );

      const orgIds = membershipDocs.docs.map(
        (doc) => doc.data()['organizationId'],
      );

      // Get org details
      for (const orgId of orgIds) {
        const orgDocs = await getDocs(
          query(collection(db, 'organizations'), where('id', '==', orgId)),
        );

        if (!orgDocs.empty) {
          const orgData = orgDocs.docs[0].data() as Organization;
          this.organizations.push(orgData);
        }
      }
    } catch (e) {
      console.error('Error loading organizations:', e);
    } finally {
      this.isLoading = false;
    }
  }

  async createOrganization() {
    if (!this.newOrgName) {
      this.showErrorMessage('Please enter an organization name');
      return;
    }

    if (!this.phoneNumber) {
      this.showErrorMessage('Please save your profile first');
      return;
    }

    try {
      this.isLoading = true;

      // Generate unique ID for the org
      const orgId = 'org_' + Math.random().toString(36).substr(2, 9);

      // Create organization
      const org: Organization = {
        id: orgId,
        name: this.newOrgName,
        description: this.newOrgDescription || 'No description provided',
        createdAt: new Date(),
        adminPhone: this.phoneNumber,
      };

      // Save to Firestore
      await setDoc(doc(db, 'organizations', orgId), org);

      // Add current user as a member
      await setDoc(doc(db, 'memberships', `${orgId}_${this.phoneNumber}`), {
        organizationId: orgId,
        phone: this.phoneNumber,
        name: this.userName || 'Anonymous User',
        email: this.email || '',
        joinedAt: new Date(),
        receiveNotifications: true,
        isAdmin: true,
      });

      // Generate join code
      const joinCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      await setDoc(doc(db, 'joinCodes', joinCode), {
        code: joinCode,
        organizationId: orgId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
      });

      this.showSuccessMessage('Organization created successfully!');
      this.newOrgName = '';
      this.newOrgDescription = '';
      this.isCreatingOrg = false;

      // Generate shareable link
      this.shareableLink = `${window.location.origin}/join?code=${joinCode}`;
      this.showShareLink = true;

      // Refresh organizations
      this.loadUserOrganizations();
    } catch (e) {
      console.error('Error creating organization:', e);
      this.showErrorMessage('Error creating organization');
    } finally {
      this.isLoading = false;
    }
  }

  async joinOrganization() {
    if (!this.joinCode) {
      this.showErrorMessage('Please enter a join code');
      return;
    }

    if (!this.phoneNumber) {
      this.showErrorMessage('Please save your profile first');
      return;
    }

    try {
      this.isLoading = true;

      // Find join code
      const joinCodeDocs = await getDocs(
        query(
          collection(db, 'joinCodes'),
          where('code', '==', this.joinCode.toUpperCase()),
        ),
      );

      if (joinCodeDocs.empty) {
        this.showErrorMessage('Invalid join code');
        return;
      }

      const joinCodeData = joinCodeDocs.docs[0].data();
      const orgId = joinCodeData['organizationId'];

      // Check if code is expired
      if (joinCodeData['expiresAt'].toDate() < new Date()) {
        this.showErrorMessage('Join code has expired');
        return;
      }

      // Add user as a member
      await setDoc(doc(db, 'memberships', `${orgId}_${this.phoneNumber}`), {
        organizationId: orgId,
        phone: this.phoneNumber,
        name: this.userName || 'Anonymous User',
        email: this.email || '',
        joinedAt: new Date(),
        receiveNotifications: true,
        isAdmin: false,
      });

      this.showSuccessMessage('Successfully joined organization!');
      this.joinCode = '';
      this.isJoiningOrg = false;

      // Refresh organizations
      this.loadUserOrganizations();
    } catch (e) {
      console.error('Error joining organization:', e);
      this.showErrorMessage('Error joining organization');
    } finally {
      this.isLoading = false;
    }
  }

  async selectOrganization(org: Organization) {
    this.selectedOrg = org;

    try {
      this.isLoading = true;
      this.members = [];

      // Get members of this organization
      const membershipDocs = await getDocs(
        query(
          collection(db, 'memberships'),
          where('organizationId', '==', org.id),
        ),
      );

      this.members = membershipDocs.docs.map((doc) => {
        const data = doc.data();
        return {
          phone: data['phone'],
          name: data['name'] || 'Unknown User',
          email: data['email'] || '',
          joinedAt: data['joinedAt'].toDate(),
          receiveNotifications: data['receiveNotifications'],
        };
      });

      // Generate a new join code if needed
      const joinCodeDocs = await getDocs(
        query(
          collection(db, 'joinCodes'),
          where('organizationId', '==', org.id),
          where('expiresAt', '>', new Date()),
        ),
      );

      if (joinCodeDocs.empty) {
        // Create a new join code
        const joinCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        await setDoc(doc(db, 'joinCodes', joinCode), {
          code: joinCode,
          organizationId: org.id,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
        });

        this.shareableLink = `${window.location.origin}/join?code=${joinCode}`;
      } else {
        const joinCode = joinCodeDocs.docs[0].data()['code'];
        this.shareableLink = `${window.location.origin}/join?code=${joinCode}`;
      }
    } catch (e) {
      console.error('Error loading organization details:', e);
      this.showErrorMessage('Error loading organization details');
    } finally {
      this.isLoading = false;
    }
  }

  async sendTestNotification() {
    if (!this.selectedOrg) return;

    try {
      this.isLoading = true;

      // Create notification in Firestore
      await addDoc(collection(db, 'notifications'), {
        organizationId: this.selectedOrg.id,
        title: 'Test Notification',
        message: `This is a test notification from ${this.userName || 'an admin'} in ${this.selectedOrg.name}.`,
        severity: 'info',
        sentAt: new Date(),
        sentBy: this.phoneNumber,
      });

      this.showSuccessMessage('Test notification sent!');
    } catch (e) {
      console.error('Error sending notification:', e);
      this.showErrorMessage('Error sending notification');
    } finally {
      this.isLoading = false;
    }
  }

  async sendOutageAlert() {
    if (!this.selectedOrg) return;

    try {
      this.isLoading = true;

      // Create outage alert notification
      await addDoc(collection(db, 'notifications'), {
        organizationId: this.selectedOrg.id,
        title: 'OUTAGE ALERT',
        message: `High probability of power outage detected in the next 24 hours. Please take necessary precautions.`,
        severity: 'high',
        sentAt: new Date(),
        sentBy: this.phoneNumber,
      });

      this.showSuccessMessage('Outage alert sent to all members!');
    } catch (e) {
      console.error('Error sending outage alert:', e);
      this.showErrorMessage('Error sending outage alert');
    } finally {
      this.isLoading = false;
    }
  }

  showSuccessMessage(msg: string) {
    this.message = msg;
    this.messageType = 'success';
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, 5000);
  }

  showErrorMessage(msg: string) {
    this.message = msg;
    this.messageType = 'error';
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, 5000);
  }

  copyShareableLink() {
    navigator.clipboard.writeText(this.shareableLink);
    this.showSuccessMessage('Link copied to clipboard!');
  }

  backToOrgList() {
    this.selectedOrg = null;
  }
}
