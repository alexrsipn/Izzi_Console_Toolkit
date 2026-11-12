import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { AppStore, ResourceTreeDownloadParams } from '../../app.store';

@Component({
  selector: 'app-resource-tree-layout',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormField,
    MatLabel,
    MatSelectModule
  ],
  templateUrl: './resource-tree-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceTreeLayoutComponent implements OnInit, OnDestroy {
  protected readonly store = inject(AppStore);

  private readonly destroy$ = new Subject<void>();

  selectedBusinessLine: string | null = null;
  includeWorkZones = false;
  includeWorkSkills = false;
  includeWorkSchedules = false;
  includeInventories = false;

  ngOnInit(): void {
    this.store.downloadCompleted$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedBusinessLine = null;
      this.includeWorkZones = false;
      this.includeWorkSkills = false;
      this.includeWorkSchedules = false;
      this.includeInventories = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get downloadParams(): ResourceTreeDownloadParams {
    return {
      businessLine: this.selectedBusinessLine ?? '',
      includeWorkZones: this.includeWorkZones,
      includeWorkSkills: this.includeWorkSkills,
      includeWorkSchedules: this.includeWorkSchedules,
      includeInventories: this.includeInventories
    };
  }

  downloadResourceTree(): void {
    this.store.handleDownloadResourceTree(this.downloadParams);
  }
}
