import { CommonModule } from '@angular/common';
import { Component, Inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import {CdkTrapFocus} from "@angular/cdk/a11y";

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

  confirm(title: string, message: string): Observable<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {title: title, message: message},
    });
    return dialogRef.afterClosed();
  }

  invalid(message: string): Observable<void> {
    const dialogRef = this.dialog.open(InvalidDialogComponent, {
      data: message,
      disableClose: true
    });
    return dialogRef.afterClosed();
  }
}

@Component({
    selector: 'app-error-dialog',
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

@Component({
    selector: 'app-confirm-dialog',
    imports: [MatIconModule, MatButtonModule, MatDialogModule],
    template: `
    <h2 mat-dialog-title>{{data.title}}</h2>
    <mat-dialog-content>
      <p>{{data.message}}</p>
    </mat-dialog-content>
    <mat-dialog-actions style="display: flex; justify-content: space-around; align-items: center;">
      <button style="width: 45%" mat-button mat-dialog-close [mat-dialog-close]="false">No</button>
      <button style="width: 45%" mat-flat-button [mat-dialog-close]="true" color="primary" cdkFocusInitial>Si</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {title: string, message: string}) {
  }
}

@Component({
    selector: 'app-invalid-dialog',
    imports: [MatIconModule, MatButtonModule, MatDialogModule],
    template: `
    <h2 mat-dialog-title>Sin autorización</h2>
    <mat-dialog-content>
      <p>{{data}}</p>
    </mat-dialog-content>
  `
})
export class InvalidDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Error) {
  }
}
