import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
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
import { UserOption } from '../../types/ofs-rest-api';

@Component({
  selector: 'app-collaboration-layout',
  imports: [
    AsyncPipe,
    NgIf,
    NgForOf,
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
  searchQuery = '';

  private readonly selectedPersonaSubject = new BehaviorSubject<string | null>(null);
  private readonly personaSearchSubject = new BehaviorSubject<string>('');

  ngOnInit(): void {
    this.store.downloadCompleted$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedQuickDate = null;
      this.selectedPersona = null;
      this.selectedChatType = '';
      this.selectedTime = null;
      this.searchQuery = '';
      this.selectedPersonaSubject.next(null);
      this.personaSearchSubject.next('');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // All environment users from GetUsers API
  users$ = this.store.select(state => state.users || []);

  // Filtered users based on dropdown search input
  filteredUsers$ = combineLatest([
    this.users$,
    this.personaSearchSubject,
    this.selectedPersonaSubject
  ]).pipe(
    map(([users, search, selected]) => {
      let filtered = users;
      if (search && search.trim() !== '') {
        const lower = search.toLowerCase();
        filtered = users.filter(u => {
          const matchesSearch = u.name.toLowerCase().includes(lower) || (u.login && u.login.toLowerCase().includes(lower));
          const isAlreadySelected = selected === u.login;
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

  downloadQuickReport(): void {
    if (this.selectedQuickDate) {
      this.store.handleQuickDownload(this.selectedQuickDate);
    }
  }

  downloadCustomReport(): void {
    this.store.handleCustomDownload({
      user: this.selectedPersona ?? '',
      chatType: this.selectedChatType,
      hour: this.selectedTime
        ? `${this.selectedTime.getHours().toString().padStart(2, '0')}:${this.selectedTime.getMinutes().toString().padStart(2, '0')}`
        : ''
    });
  }
}
