import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConcertsService } from '../../core/services/concerts.service';
import { Concert } from '../../core/models';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { ConcertCardComponent } from '../../shared/components/concert-card/concert-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, MatProgressSpinnerModule, ConcertCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private store = inject(Store);
  private concertsService = inject(ConcertsService);

  currentUser$ = this.store.select(selectCurrentUser);
  concerts: Concert[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.concertsService.getHomeConciertos().subscribe({
      next: c => { this.concerts = c; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }
}
