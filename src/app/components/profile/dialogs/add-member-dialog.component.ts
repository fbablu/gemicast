import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Members</h2>
    <div mat-dialog-content>
      <p>Add one or more members to your organization</p>

      <form [formGroup]="memberForm">
        <div formArrayName="members">
          <div
            *ngFor="let member of members.controls; let i = index"
            [formGroupName]="i"
            class="member-row"
          >
            <div class="member-fields">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input
                  matInput
                  formControlName="name"
                  placeholder="Full name"
                />
                <mat-error *ngIf="member.get('name')?.invalid"
                  >Name is required</mat-error
                >
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input
                  matInput
                  formControlName="phone"
                  placeholder="Phone number"
                  type="tel"
                />
                <mat-error *ngIf="member.get('phone')?.invalid"
                  >Valid phone number is required</mat-error
                >
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email (Optional)</mat-label>
                <input
                  matInput
                  formControlName="email"
                  placeholder="Email address"
                  type="email"
                />
                <mat-error *ngIf="member.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>
            </div>

            <button
              mat-icon-button
              color="warn"
              type="button"
              (click)="removeMember(i)"
              *ngIf="members.controls.length > 1"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </form>

      <div class="add-member-action">
        <button
          mat-stroked-button
          color="primary"
          type="button"
          (click)="addMember()"
        >
          <mat-icon>add</mat-icon> Add Another Member
        </button>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="memberForm.invalid"
        [mat-dialog-close]="memberForm.value.members"
      >
        Add Members
      </button>
    </div>
  `,
  styles: [
    `
      .member-row {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
      }
      .member-fields {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        flex: 1;
      }
      mat-form-field {
        flex: 1;
        min-width: 150px;
      }
      .add-member-action {
        margin-top: 20px;
      }
    `,
  ],
})
export class AddMemberDialogComponent {
  memberForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.memberForm = this.fb.group({
      members: this.fb.array([this.createMemberGroup()]),
    });
  }

  get members() {
    return this.memberForm.get('members') as FormArray;
  }

  createMemberGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.email]],
    });
  }

  addMember() {
    this.members.push(this.createMemberGroup());
  }

  removeMember(index: number) {
    this.members.removeAt(index);
  }
}
