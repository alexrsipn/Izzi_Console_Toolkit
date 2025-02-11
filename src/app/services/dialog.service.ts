import { CommonModule } from '@angular/common';
import { Component, Inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  error(error: Error | string): Observable<void> {
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      data: error,
    });
    return dialogRef.afterClosed();
  }

  success(message: string): Observable<void> {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      data: message,
    });
    return dialogRef.afterClosed();
  }
}

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule, CommonModule],
  template: `
    <h1 mat-dialog-title style="margin-top: 1rem; display: flex">
      <span>Error </span>
      <span style="align-self: center;">
        <mat-icon aria-hidden="false" aria-label="Error icon" fontIcon="error" color="warn"></mat-icon>
      </span>
    </h1>
    <mat-dialog-content>
      <span *ngIf="data; else unidentifiedError">
        <p>{{data && data}}</p>
        <p>{{data.name && data.name}}</p>
        <p>{{data.message && data.message}}</p>
      </span>
      <ng-template #unidentifiedError>
        <p>Error no identificado</p>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button style="width: 100%;" mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `
})
export class ErrorDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Error) {}
}

@Component({
  selector: 'app-scc-dialog',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <h1 mat-dialog-title style="margin-top: 1rem; display: flex">
      <span>Éxito </span>
      <span style="align-self: center;">
        <mat-icon aria-hidden="false" aria-label="Success icon" fontIcon="check_circle" color="primary"></mat-icon>
      </span>
    </h1>
    <mat-dialog-content>
      <p>{{data}}</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button style="width: 100%;" mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `
})
export class SuccessDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Error) {}
}