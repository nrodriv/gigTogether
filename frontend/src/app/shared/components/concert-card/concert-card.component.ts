import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Concert } from '../../../core/models';

@Component({
  selector: 'app-concert-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './concert-card.component.html',
  styleUrl: './concert-card.component.scss',
  providers: [DatePipe],
  host: { style: 'display: block' }
})
export class ConcertCardComponent {
  @Input({ required: true }) concert!: Concert;
  @Input() layout: 'grid' | 'list' = 'grid';

  private router = inject(Router);
  private datePipe = inject(DatePipe);

  navigateToConcert(): void {
    this.router.navigate(['/conciertos', this.concert.id]);
  }

  formattedDate(): string {
    const dateStr = this.datePipe.transform(this.concert.date, 'EEE d MMM', undefined, 'es-ES') ?? '';
    const time = this.concert.doorsOpenTime.substring(0, 5);
    return `${dateStr} · ${time}h`;
  }
}
