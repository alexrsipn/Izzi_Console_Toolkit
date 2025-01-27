import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { map } from 'rxjs';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import moment from 'moment';

@Component({
  selector: 'app-control-date',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './control-date.component.html',
})
export class ControlDateComponent {
  // @Output() rangeChange = new EventEmitter<any>();

  range = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [
      Validators.required,
      this.maxAllowedRangeValidator,
    ]),
  });

  dateFilter = (d: Date | null): boolean => {
    // let yesterdayMoment = moment().subtract(1, 'days');
    let yesterdayMoment = moment();
    let pastMoment = moment().subtract(90, 'days');
    const yesterday = new Date(yesterdayMoment.format('YYYY-MM-DD'));
    const past = new Date(pastMoment.format('YYYY-MM-DD'));
    return d ? d < yesterday && d > past : false;
  };

  @Output() rangeChange = this.range.valueChanges.pipe(
    map((range) => ({
      from: range.start ? this.toFormattedDateString(range.start) : null,
      to: range.end ? this.toFormattedDateString(range.end) : null,
      valid: this.range.valid,
    }))
  );

  setRangeShortcut(dias: number) {
    let startMoment =
      dias > 1
        ? moment().subtract(dias, 'days').format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD');
    let endMoment = moment().format('YYYY-MM-DD');
    this.range.setValue({
      start: new Date(startMoment),
      end: new Date(endMoment),
    });
    this.range.get('start')?.setErrors(null);
    this.range.get('end')?.setErrors(null);
    this.range.updateValueAndValidity();
  }

  private toFormattedDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private maxAllowedRangeValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const start: Date | null = control.parent?.get('start')?.value;
    const end: Date | null = control.value;
    if (!start || !end) return null;

    const maxAllowedRange = 15;
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const differenceInMilliseconds = Math.abs(end.getTime() - start.getTime());
    const differenceInDays = differenceInMilliseconds / millisecondsPerDay;

    return differenceInDays > maxAllowedRange
      ? { maxAllowedRange: true }
      : null;
  }
}
