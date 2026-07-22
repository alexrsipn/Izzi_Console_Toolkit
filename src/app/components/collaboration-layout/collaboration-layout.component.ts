import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatInput, MatLabel } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AppStore } from '../../app.store';
import { BehaviorSubject, combineLatest, map, Subject, takeUntil } from 'rxjs';
import { Resource } from '../../types/ofs-rest-api';

@Component({
  selector: 'app-collaboration-layout',
  imports: [
    AsyncPipe,
    NgIf,
    NgForOf,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatTimepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './collaboration-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollaborationLayoutComponent implements OnInit, OnDestroy {
  protected readonly store = inject(AppStore);

  private readonly destroy$ = new Subject<void>();

  selectedPersona: string | null = null;
  selectedQuickDate: string | null = null;
  selectedChatType = '';
  selectedTime: Date | null = null;

  private readonly selectedPersonaSubject = new BehaviorSubject<string | null>(null);
  private readonly personaSearchSubject = new BehaviorSubject<string>('');

  ngOnInit(): void {
    this.store.downloadCompleted$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedQuickDate = null;
      this.selectedPersona = null;
      this.selectedChatType = '';
      this.selectedTime = null;
      this.selectedPersonaSubject.next(null);
      this.personaSearchSubject.next('');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Unfiltered technician list (resourceType === 'TEC')
  technicians$ = this.store.select(state => state.resourcesTreeRaw || []).pipe(
    map(resources => resources.filter(res => res.resourceType === 'TEC'))
  );

  // Filtered technician list based on dropdown search input
  filteredTechnicians$ = combineLatest([
    this.technicians$,
    this.personaSearchSubject,
    this.selectedPersonaSubject
  ]).pipe(
    map(([techs, search, selected]) => {
      let filtered = techs;
      if (search && search.trim() !== '') {
        const lower = search.toLowerCase();
        filtered = techs.filter(t => {
          const matchesSearch = t.name.toLowerCase().includes(lower) || t.resourceId.toLowerCase().includes(lower) || (t.login && t.login.toLowerCase().includes(lower));
          const isAlreadySelected = selected === t.login;
          return matchesSearch || isAlreadySelected;
        });
      }
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    })
  );

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
  }

  availableDates$ = this.store.select((state) => state.availableReportDates || []).pipe(
    map((dates) => dates.map((dateString) => ({
      value: dateString,
      label: this.formatDate(dateString)
    })))
  )

  get isAnyFilterApplied(): boolean {
    return this.selectedPersona !== null ||
      this.selectedChatType !== '' ||
      this.selectedTime !== null;
  }

  onPersonaSearch(value: string): void {
    this.personaSearchSubject.next(value);
  }
  onPersonaSelectionChange(value: string | null): void {
    this.selectedPersonaSubject.next(value);
  }

  getSelectedPersonaTriggerLabel(techs: Resource[]): string {
    if (!this.selectedPersona) {
      return '';
    }
    const selectedTech = techs.find(t => this.selectedPersona === t.login);
    return selectedTech?.name ?? '';
  }

  downloadQuickReport(): void {
    if (this.selectedQuickDate) {
      this.store.handleQuickDownload(this.selectedQuickDate);
    }
  }

  downloadCustomReport(): void {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    this.store.handleCustomDownload({
      user: this.selectedPersona ?? '',
      chatType: this.selectedChatType,
      hour: this.selectedTime ? `${hh}:${min}` : ''
    });
  }
}
