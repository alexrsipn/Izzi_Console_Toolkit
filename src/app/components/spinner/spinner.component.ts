import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-spinner',
    imports: [MatProgressSpinnerModule],
    templateUrl: './spinner.component.html'
})
export class SpinnerComponent {
  @Input() diameter = 60;
}
