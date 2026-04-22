import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { ConcertsService } from '../../../core/services/concerts.service';
import { GroupsService } from '../../../core/services/groups.service';
import { Concert, ArrivalWindow, ActivityType } from '../../../core/models';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';

interface ArrivalWindowOption {
  label: string;
  value: ArrivalWindow;
}

interface ActivityOption {
  label: string;
  value: ActivityType;
}

@Component({
  selector: 'app-concert-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatProgressSpinnerModule],
  templateUrl: './concert-detail.component.html',
  styleUrl: './concert-detail.component.scss'
})
export class ConcertDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private concertsService = inject(ConcertsService);
  private groupsService = inject(GroupsService);
  private router = inject(Router);
  private store = inject(Store);

  concert: Concert | null = null;
  isLoading = true;
  alreadyInGroup = false;
  isBanned = false;
  isPast = false;
  joinSuccess = false;
  joinLoading = false;
  joinError = '';

  selectedMeetingPointId: string | null = null;
  selectedArrivalWindow: ArrivalWindow | null = null;
  selectedArrivalLabel: string | null = null;
  selectedActivity: ActivityType | null = null;

  arrivalWindows: ArrivalWindowOption[] = [];
  activities: ActivityOption[] = [
    { label: 'Tomar algo tranquilamente', value: 'HAVE_DRINK' },
    { label: 'Coger buen sitio para el concierto', value: 'GET_GOOD_SPOT' },
    { label: 'Charlar sin prisa antes del concierto', value: 'CHAT' },
  ];

  get isFormComplete(): boolean {
    return !!this.selectedMeetingPointId &&
           !!this.selectedArrivalWindow &&
           !!this.selectedActivity;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(p => p.get('id'))
    ).subscribe(id => {
      if (!id) {
        this.router.navigate(['/conciertos']);
        return;
      }
      this.concertsService.getById(id).subscribe({
        next: c => {
          this.concert = c;
          this.isLoading = false;
          this.alreadyInGroup = !!c.myGroup;
          this.isBanned = !!c.isBanned;
          this.isPast = !!c.isPast;
          this.arrivalWindows = this.generateArrivalWindows(c.doorsOpenTime);
        },
        error: () => {
          this.isLoading = false;
          this.router.navigate(['/conciertos']);
        }
      });
    });
  }

  generateArrivalWindows(doorsOpenTime: string): ArrivalWindowOption[] {
    const [h, m] = doorsOpenTime.split(':').map(Number);
    const totalMins = h * 60 + m;
    return [
      {
        label: `${this.minsToTime(totalMins - 90)} – ${this.minsToTime(totalMins - 60)}`,
        value: 'EARLY'
      },
      {
        label: `${this.minsToTime(totalMins - 60)} – ${this.minsToTime(totalMins - 30)}`,
        value: 'ON_TIME'
      },
      {
        label: `${this.minsToTime(totalMins - 30)} – ${this.minsToTime(totalMins)}`,
        value: 'LATE'
      }
    ];
  }

  private minsToTime(mins: number): string {
    const total = ((mins % 1440) + 1440) % 1440;
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  onJoin(): void {
    if (!this.isFormComplete) {
      this.joinError = 'Selecciona punto de encuentro, franja y preferencia';
      return;
    }
    if (!this.concert) return;

    this.joinLoading = true;
    this.joinError = '';

    const dto = {
      meetingPointId: this.selectedMeetingPointId!,
      arrivalWindow: this.selectedArrivalWindow!,
      activityType: this.selectedActivity!
    };

    const concertForService = {
      id: this.concert.id,
      title: this.concert.title,
      artistName: this.concert.artistName,
      imageUrl: this.concert.imageUrl,
      date: this.concert.date,
      doorsOpenTime: this.concert.doorsOpenTime,
      venue: {
        name: this.concert.venue.name,
        address: this.concert.venue.address
      }
    };

    this.groupsService.joinConcert(this.concert.id, dto, concertForService).subscribe({
      next: () => {
        this.joinLoading = false;
        this.joinSuccess = true;
        this.alreadyInGroup = true;
      },
      error: () => {
        this.joinLoading = false;
        this.joinError = 'No se pudo unir al grupo. Inténtalo de nuevo.';
      }
    });
  }
}
