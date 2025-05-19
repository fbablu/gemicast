import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Firebase imports
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';

// Google Sheets API (optional - for later integration)
import { HttpClientModule, HttpClient } from '@angular/common/http';

// Import dialog components (we'll create these later)
import { AddMemberDialogComponent } from './dialogs/add-member-dialog.component';
import { CreateAlertDialogComponent } from './dialogs/create-alert-dialog.component';
import { FirebaseService } from '../../services/firebase.service';

// Your new Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDrTRNc6bh0W3kEwTHLQPlXo1VL_6Kjn9Y',
  authDomain: 'gemicast-eac3e.firebaseapp.com',
  projectId: 'gemicast-eac3e',
  storageBucket: 'gemicast-eac3e.firebasestorage.app',
  messagingSenderId: '206031573739',
  appId: '1:206031573739:web:5367867a48d4a0db0764ae',
  measurementId: 'G-0SB35Y09GH',
};

// Interfaces
interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  adminPhone: string;
  memberCount?: number;
  alertsCount?: number;
}

interface Member {
  id?: string;
  phone: string;
  name: string;
  email?: string;
  joinedAt: Date;
  receiveNotifications: boolean;
  isAdmin?: boolean;
}

interface Alert {
  id?: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  sentAt: Date;
  sentBy: string;
  sentByName?: string;
  recipientCount?: number;
  status?: 'sending' | 'sent' | 'failed';
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatTabsModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    HttpClientModule,
  ],
})
export class ProfileComponent implements OnInit {
  private app: any;
  private db: any;

  // User info
  userForm: FormGroup;
  phoneNumber: string = '';
  userName: string = '';
  email: string = '';
  receiveTexts: boolean = true;

  // Organization info
  organizations: Organization[] = [];
  selectedOrg: Organization | null = null;
  newOrgForm: FormGroup;
  joinForm: FormGroup;

  // Organization members
  members: Member[] = [];
  displayedMemberColumns: string[] = [
    'name',
    'phone',
    'email',
    'joinedAt',
    'notifications',
    'actions',
  ];

  // Alerts/Notifications
  recentAlerts: Alert[] = [];
  displayedAlertColumns: string[] = [
    'severity',
    'title',
    'sentAt',
    'sentBy',
    'recipientCount',
  ];

  // UI state
  activeTab = 0;
  isCreatingOrg: boolean = false;
  isJoiningOrg: boolean = false;
  isLoading: boolean = false;
  loadingMessage: string = '';

  // Google Sheets sync status (for future implementation)
  isGoogleSheetsConnected: boolean = false;
  new: any = null;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient,
  ) {
    // Create forms first
    this.userForm = this.fb.group({
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{10}$')],
      ],
      userName: ['', Validators.required],
      email: ['', [Validators.email]],
      receiveTexts: [true],
    });

    this.newOrgForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });

    this.joinForm = this.fb.group({
      joinCode: ['', Validators.required],
    });
  }

  formatDate(): string {
    return this.formatDatetime(new Date());
  }

  ngOnInit(): void {
    // Initialize Firebase only in ngOnInit
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);

      // Check saved user info
      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone) {
        this.phoneNumber = savedPhone;
        this.userForm.patchValue({ phoneNumber: savedPhone });
        // Temporarily comment out Firebase operations
        // this.loadUserData();
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  async saveUserInfo() {
    if (this.userForm.invalid) {
      this.showSnackBar('Please fill in all required fields correctly');
      return;
    }

    const formData = this.userForm.value;
    this.phoneNumber = formData.phoneNumber;
    this.userName = formData.userName;
    this.email = formData.email;
    this.receiveTexts = formData.receiveTexts;

    this.showLoading('Saving profile...');

    try {
      // Save to Firestore
      await setDoc(doc(this.db, 'users', this.phoneNumber), {
        phone: this.phoneNumber,
        name: this.userName,
        email: this.email || '',
        receiveNotifications: this.receiveTexts,
        updatedAt: serverTimestamp(),
      });

      // Save locally
      localStorage.setItem('userPhone', this.phoneNumber);

      this.showSnackBar('Profile updated successfully!');
      this.loadUserOrganizations();
    } catch (e) {
      console.error('Error saving user info:', e);
      this.showSnackBar('Error saving profile', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async loadUserData() {
    this.showLoading('Loading profile...');

    try {
      // Load user data from Firestore
      const userDoc = await getDoc(doc(this.db, 'users', this.phoneNumber));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userName = userData['name'] || '';
        this.email = userData['email'] || '';
        this.receiveTexts = userData['receiveNotifications'] !== false;

        // Update form
        this.userForm.patchValue({
          userName: this.userName,
          email: this.email,
          receiveTexts: this.receiveTexts,
        });
      }

      // Load user's organizations
      await this.loadUserOrganizations();
    } catch (e) {
      console.error('Error loading user data:', e);
      this.showSnackBar('Error loading profile data', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async loadUserOrganizations() {
    if (!this.phoneNumber) return;

    this.showLoading('Loading organizations...');

    try {
      this.organizations = [];

      // Get organizations where user is a member
      const membershipDocs = await getDocs(
        query(
          collection(this.db, 'memberships'),
          where('phone', '==', this.phoneNumber),
        ),
      );

      const orgIds = membershipDocs.docs.map(
        (doc) => doc.data()['organizationId'],
      );

      // Get org details
      for (const orgId of orgIds) {
        const orgDoc = await getDoc(doc(this.db, 'organizations', orgId));

        if (orgDoc.exists()) {
          const orgData = orgDoc.data();

          // Convert Firestore timestamp to Date
          let createdAt: Date;
          if (orgData['createdAt'] instanceof Timestamp) {
            createdAt = orgData['createdAt'].toDate();
          } else {
            createdAt = new Date(orgData['createdAt']);
          }

          // Get member count
          const memberCount = await this.getOrgMemberCount(orgId);

          // Get alerts count
          const alertsCount = await this.getOrgAlertsCount(orgId);

          const organization: Organization = {
            id: orgId,
            name: orgData['name'],
            description: orgData['description'] || 'No description provided',
            createdAt: createdAt,
            adminPhone: orgData['adminPhone'],
            memberCount: memberCount,
            alertsCount: alertsCount,
          };

          this.organizations.push(organization);
        }
      }

      // Sort organizations by date (newest first)
      this.organizations.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } catch (e) {
      console.error('Error loading organizations:', e);
      this.showSnackBar('Error loading organizations', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async getOrgMemberCount(orgId: string): Promise<number> {
    try {
      const memberQuery = query(
        collection(this.db, 'memberships'),
        where('organizationId', '==', orgId),
      );
      const memberDocs = await getDocs(memberQuery);
      return memberDocs.size;
    } catch (e) {
      console.error('Error getting member count:', e);
      return 0;
    }
  }

  async getOrgAlertsCount(orgId: string): Promise<number> {
    try {
      const alertQuery = query(
        collection(this.db, 'notifications'),
        where('organizationId', '==', orgId),
      );
      const alertDocs = await getDocs(alertQuery);
      return alertDocs.size;
    } catch (e) {
      console.error('Error getting alerts count:', e);
      return 0;
    }
  }

  async createOrganization() {
    if (this.newOrgForm.invalid) {
      this.showSnackBar('Please enter an organization name');
      return;
    }

    if (!this.phoneNumber) {
      this.showSnackBar('Please save your profile first');
      return;
    }

    this.showLoading('Creating organization...');

    try {
      const formData = this.newOrgForm.value;

      // Generate unique ID for the org
      const orgId = 'org_' + Math.random().toString(36).substr(2, 9);

      // Create organization
      const org: Organization = {
        id: orgId,
        name: formData.name,
        description: formData.description || 'No description provided',
        createdAt: new Date(),
        adminPhone: this.phoneNumber,
      };

      // Save to Firestore
      await setDoc(doc(this.db, 'organizations', orgId), {
        ...org,
        createdAt: serverTimestamp(),
      });

      // Add current user as a member
      await setDoc(
        doc(this.db, 'memberships', `${orgId}_${this.phoneNumber}`),
        {
          organizationId: orgId,
          phone: this.phoneNumber,
          name: this.userName || 'Anonymous User',
          email: this.email || '',
          joinedAt: serverTimestamp(),
          receiveNotifications: true,
          isAdmin: true,
        },
      );

      // Generate join code
      const joinCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      await setDoc(doc(this.db, 'joinCodes', joinCode), {
        code: joinCode,
        organizationId: orgId,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
      });

      this.showSnackBar('Organization created successfully!');
      this.newOrgForm.reset();
      this.isCreatingOrg = false;

      // Refresh organizations and select the new one
      await this.loadUserOrganizations();
      const newOrg = this.organizations.find((o) => o.id === orgId);
      if (newOrg) {
        this.selectOrganization(newOrg);
      }

      // Show the invite code
      this.showSnackBar(`Join code: ${joinCode}`, 'info', 10000);
    } catch (e) {
      console.error('Error creating organization:', e);
      this.showSnackBar('Error creating organization', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async joinOrganization() {
    const formData = this.joinForm.value;

    if (!formData.joinCode) {
      this.showSnackBar('Please enter a join code');
      return;
    }

    if (!this.phoneNumber) {
      this.showSnackBar('Please save your profile first');
      return;
    }

    this.showLoading('Joining organization...');

    try {
      // Find join code
      const joinCodeSnapshot = await getDocs(
        query(
          collection(this.db, 'joinCodes'),
          where('code', '==', formData.joinCode.toUpperCase()),
        ),
      );

      if (joinCodeSnapshot.empty) {
        this.showSnackBar('Invalid join code', 'error');
        return;
      }

      const joinCodeData = joinCodeSnapshot.docs[0].data();
      const orgId = joinCodeData['organizationId'];

      // Check if code is expired
      if (joinCodeData['expiresAt'] instanceof Timestamp) {
        if (joinCodeData['expiresAt'].toDate() < new Date()) {
          this.showSnackBar('Join code has expired', 'error');
          return;
        }
      } else if (new Date(joinCodeData['expiresAt']) < new Date()) {
        this.showSnackBar('Join code has expired', 'error');
        return;
      }

      // Add user as a member
      await setDoc(
        doc(this.db, 'memberships', `${orgId}_${this.phoneNumber}`),
        {
          organizationId: orgId,
          phone: this.phoneNumber,
          name: this.userName || 'Anonymous User',
          email: this.email || '',
          joinedAt: serverTimestamp(),
          receiveNotifications: true,
          isAdmin: false,
        },
      );

      this.showSnackBar('Successfully joined organization!');
      this.joinForm.reset();
      this.isJoiningOrg = false;

      // Refresh organizations and select the new one
      await this.loadUserOrganizations();
      const newOrg = this.organizations.find((o) => o.id === orgId);
      if (newOrg) {
        this.selectOrganization(newOrg);
      }
    } catch (e) {
      console.error('Error joining organization:', e);
      this.showSnackBar('Error joining organization', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async selectOrganization(org: Organization) {
    this.selectedOrg = org;
    this.activeTab = 0; // Reset to first tab

    this.showLoading('Loading organization details...');

    try {
      // Get members of this organization
      await this.loadOrgMembers(org.id);

      // Get recent alerts
      await this.loadOrgAlerts(org.id);
    } catch (e) {
      console.error('Error loading organization details:', e);
      this.showSnackBar('Error loading organization details', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async loadOrgMembers(orgId: string) {
    try {
      const membershipDocs = await getDocs(
        query(
          collection(this.db, 'memberships'),
          where('organizationId', '==', orgId),
        ),
      );

      this.members = membershipDocs.docs.map((doc) => {
        const data = doc.data();

        // Convert Firestore timestamp to Date
        let joinedAt: Date;
        if (data['joinedAt'] instanceof Timestamp) {
          joinedAt = data['joinedAt'].toDate();
        } else {
          joinedAt = new Date(data['joinedAt']);
        }

        return {
          id: doc.id,
          phone: data['phone'],
          name: data['name'] || 'Unknown User',
          email: data['email'] || '',
          joinedAt: joinedAt,
          receiveNotifications: data['receiveNotifications'] || false,
          isAdmin: data['isAdmin'] || false,
        };
      });

      // Sort members by join date (newest first)
      this.members.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
    } catch (e) {
      console.error('Error loading members:', e);
      throw e;
    }
  }

  async loadOrgAlerts(orgId: string) {
    try {
      const alertDocs = await getDocs(
        query(
          collection(this.db, 'notifications'),
          where('organizationId', '==', orgId),
          orderBy('sentAt', 'desc'),
          limit(10),
        ),
      );

      this.recentAlerts = alertDocs.docs.map((doc) => {
        const data = doc.data();

        // Convert Firestore timestamp to Date
        let sentAt: Date;
        if (data['sentAt'] instanceof Timestamp) {
          sentAt = data['sentAt'].toDate();
        } else {
          sentAt = new Date(data['sentAt']);
        }

        return {
          id: doc.id,
          title: data['title'],
          message: data['message'],
          severity: data['severity'] || 'info',
          sentAt: sentAt,
          sentBy: data['sentBy'],
          sentByName: data['sentByName'] || 'Unknown',
          recipientCount: data['recipientCount'] || this.members.length,
          status: data['status'] || 'sent',
        };
      });
    } catch (e) {
      console.error('Error loading alerts:', e);
      throw e;
    }
  }

  openAddMemberDialog() {
    if (!this.selectedOrg) return;

    const dialogRef = this.dialog.open(AddMemberDialogComponent, {
      width: '500px',
      data: { organizationId: this.selectedOrg.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addMembers(result);
      }
    });
  }

  async addMembers(members: any[]) {
    if (!this.selectedOrg || !members.length) return;

    this.showLoading('Adding members...');

    try {
      for (const member of members) {
        // Generate member ID
        const memberId = `${this.selectedOrg.id}_${member.phone}`;

        // Check if member already exists
        const memberDoc = await getDoc(doc(this.db, 'memberships', memberId));

        if (!memberDoc.exists()) {
          // Add member to firestore
          await setDoc(doc(this.db, 'memberships', memberId), {
            organizationId: this.selectedOrg.id,
            phone: member.phone,
            name: member.name,
            email: member.email || '',
            joinedAt: serverTimestamp(),
            receiveNotifications: true,
            isAdmin: false,
          });
        }
      }

      this.showSnackBar(`Added ${members.length} members`);

      // Reload members
      await this.loadOrgMembers(this.selectedOrg.id);
    } catch (e) {
      console.error('Error adding members:', e);
      this.showSnackBar('Error adding members', 'error');
    } finally {
      this.hideLoading();
    }
  }

  openCreateAlertDialog() {
    if (!this.selectedOrg) return;

    const dialogRef = this.dialog.open(CreateAlertDialogComponent, {
      width: '600px',
      data: {
        organizationId: this.selectedOrg.id,
        organizationName: this.selectedOrg.name,
        memberCount: this.members.length,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sendAlert(result);
      }
    });
  }

  async sendAlert(alertData: any) {
    if (!this.selectedOrg) return;

    this.showLoading('Sending alert...');

    try {
      // Create notification in Firestore
      const alertRef = await addDoc(collection(this.db, 'notifications'), {
        organizationId: this.selectedOrg.id,
        title: alertData.title,
        message: alertData.message,
        severity: alertData.severity || 'info',
        sentAt: serverTimestamp(),
        sentBy: this.phoneNumber,
        sentByName: this.userName,
        recipientCount: this.members.length,
        status: 'sent',
      });

      // Also add to Google Sheets if needed
      if (this.isGoogleSheetsConnected) {
        this.syncAlertToGoogleSheets({
          id: alertRef.id,
          ...alertData,
          sentAt: new Date(),
          sentBy: this.phoneNumber,
          sentByName: this.userName,
          recipientCount: this.members.length,
        });
      }

      this.showSnackBar('Alert sent successfully!');

      // Reload alerts
      await this.loadOrgAlerts(this.selectedOrg.id);
    } catch (e) {
      console.error('Error sending alert:', e);
      this.showSnackBar('Error sending alert', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async toggleMemberNotifications(member: Member) {
    if (!this.selectedOrg) return;

    this.showLoading('Updating member...');

    try {
      const memberId = `${this.selectedOrg.id}_${member.phone}`;

      // Update the member's notification status
      await updateDoc(doc(this.db, 'memberships', memberId), {
        receiveNotifications: !member.receiveNotifications,
      });

      // Update local data
      member.receiveNotifications = !member.receiveNotifications;

      this.showSnackBar('Member updated');
    } catch (e) {
      console.error('Error updating member:', e);
      this.showSnackBar('Error updating member', 'error');
    } finally {
      this.hideLoading();
    }
  }

  connectGoogleSheets() {
    // This would normally open OAuth flow or API key setup
    // For this demo, we'll just simulate connecting
    this.showLoading('Connecting to Google Sheets...');

    setTimeout(() => {
      this.isGoogleSheetsConnected = true;
      this.hideLoading();
      this.showSnackBar('Connected to Google Sheets');
    }, 2000);
  }

  syncAlertToGoogleSheets(alert: Alert) {
    // In a real implementation, this would call a backend API
    // that would handle the Google Sheets API authentication and writing
    console.log('Would sync to Google Sheets:', alert);

    // Example of what this might look like with a backend API:
    /*
    this.http.post('/api/sheets/sync', {
      type: 'alert',
      data: alert
    }).subscribe(
      response => console.log('Synced to Google Sheets', response),
      error => console.error('Error syncing to Google Sheets', error)
    );
    */
  }

  refreshData() {
    if (this.selectedOrg) {
      this.loadOrgMembers(this.selectedOrg.id);
      this.loadOrgAlerts(this.selectedOrg.id);
    } else {
      this.loadUserOrganizations();
    }
  }

  showLoading(message: string = 'Loading...') {
    this.isLoading = true;
    this.loadingMessage = message;
  }

  hideLoading() {
    this.isLoading = false;
    this.loadingMessage = '';
  }

  showSnackBar(
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    duration: number = 3000,
  ) {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: [`snackbar-${type}`],
    });
  }

  backToOrgList() {
    this.selectedOrg = null;
  }

  formatDatetime(date: Date): string {
    return date.toLocaleString();
  }

  getAlertIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'warning';
      case 'high':
        return 'priority_high';
      case 'warning':
        return 'report_problem';
      default:
        return 'info';
    }
  }

  getAlertColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'rgb(244, 67, 54)';
      case 'high':
        return 'rgb(255, 87, 34)';
      case 'warning':
        return 'rgb(255, 152, 0)';
      default:
        return 'rgb(33, 150, 243)';
    }
  }
}
