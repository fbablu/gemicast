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
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

interface DialogData {
  organizationId: string;
  organizationName: string;
  memberCount: number;
}

@Component({
  selector: 'app-create-alert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>Send Alert</h2>
    <div mat-dialog-content>
      <p>
        Send an alert to all {{ data.memberCount }} members in
        {{ data.organizationName }}
      </p>

      <form [formGroup]="alertForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Alert Title</mat-label>
          <input
            matInput
            formControlName="title"
            placeholder="Enter alert title"
          />
          <mat-error *ngIf="alertForm.get('title')?.hasError('required')">
            Title is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Message</mat-label>
          <textarea
            matInput
            formControlName="message"
            placeholder="Enter alert message"
            rows="4"
          ></textarea>
          <mat-error *ngIf="alertForm.get('message')?.hasError('required')">
            Message is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Severity</mat-label>
          <mat-select formControlName="severity">
            <mat-option value="info">
              <div class="severity-option">
                <div class="severity-icon" style="background-color: #2196f3">
                  <mat-icon>info</mat-icon>
                </div>
                <span>Information</span>
              </div>
            </mat-option>
            <mat-option value="warning">
              <div class="severity-option">
                <div class="severity-icon" style="background-color: #ff9800">
                  <mat-icon>report_problem</mat-icon>
                </div>
                <span>Warning</span>
              </div>
            </mat-option>
            <mat-option value="high">
              <div class="severity-option">
                <div class="severity-icon" style="background-color: #ff5722">
                  <mat-icon>priority_high</mat-icon>
                </div>
                <span>High Alert</span>
              </div>
            </mat-option>
            <mat-option value="critical">
              <div class="severity-option">
                <div class="severity-icon" style="background-color: #f44336">
                  <mat-icon>warning</mat-icon>
                </div>
                <span>Critical</span>
              </div>
            </mat-option>
          </mat-select>
          <mat-error *ngIf="alertForm.get('severity')?.hasError('required')">
            Severity is required
          </mat-error>
        </mat-form-field>
      </form>

      <div class="alert-preview">
        <h3>Preview</h3>
        <div
          class="preview-container"
          [ngClass]="'preview-' + alertForm.get('severity')?.value"
        >
          <div class="preview-header">
            <div
              class="severity-indicator"
              [ngStyle]="{
                'background-color': getSeverityColor(
                  alertForm.get('severity')?.value
                ),
              }"
            >
              <mat-icon>{{
                getSeverityIcon(alertForm.get('severity')?.value)
              }}</mat-icon>
            </div>
            <div class="preview-title">
              {{ alertForm.get('title')?.value || 'Alert Title' }}
            </div>
          </div>
          <div class="preview-message">
            {{
              alertForm.get('message')?.value ||
                'Alert message will appear here'
            }}
          </div>
        </div>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="alertForm.invalid"
        [mat-dialog-close]="alertForm.value"
      >
        Send Alert
      </button>
    </div>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      .severity-option {
        display: flex;
        align-items: center;
      }
      .severity-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
      }
      .severity-icon mat-icon {
        font-size: 14px;
        height: 14px;
        width: 14px;
        color: white;
      }
      .alert-preview {
        margin-top: 20px;
      }
      .alert-preview h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: 500;
      }
      .preview-container {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }
      .preview-header {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
      }
      .preview-title {
        font-weight: 500;
        margin-left: 10px;
      }
      .preview-message {
        padding: 15px;
        white-space: pre-wrap;
      }
      .preview-info .preview-header {
        background-color: rgba(33, 150, 243, 0.1);
      }
      .preview-warning .preview-header {
        background-color: rgba(255, 152, 0, 0.1);
      }
      .preview-high .preview-header {
        background-color: rgba(255, 87, 34, 0.1);
      }
      .preview-critical .preview-header {
        background-color: rgba(244, 67, 54, 0.1);
      }
    `,
  ],
})
export class CreateAlertDialogComponent {
  alertForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateAlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.alertForm = this.fb.group({
      title: ['', Validators.required],
      message: ['', Validators.required],
      severity: ['info', Validators.required],
    });
  }

  getSeverityIcon(severity: string): string {
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

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff5722';
      case 'warning':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  }
}
