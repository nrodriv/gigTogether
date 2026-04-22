import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileService, PublicProfile } from '../../../core/services/profile.service';
import { ProfileCardComponent } from '../../../shared/components/profile-card/profile-card.component';
import { updateUser } from '../../../store/auth/auth.actions';
import { selectCurrentUser, selectIsAdmin } from '../../../store/auth/auth.selectors';
import { take } from 'rxjs/operators';

const ALL_GENRES = [
  'Folk', 'Indie', 'Rock', 'Country rock', 'Noise pop',
  'Anti-folk', 'Indie folk', 'Folk rock', 'Pop', 'Jazz',
  'Blues', 'Metal', 'Punk', 'Electrónica', 'Hip-hop',
  'R&B', 'Reggae', 'Clásica', 'Soul', 'Funk'
];

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule, ProfileCardComponent],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.scss'
})
export class PublicProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);

  allGenres = ALL_GENRES;
  selectedGenres = signal<string[]>([]);
  saving = signal(false);
  previewOpen = signal(false);
  previewProfile = signal<PublicProfile | null>(null);
  isAdmin = signal(false);
  showUrlInput = signal(false);

  form = this.fb.group({
    bio: ['', [Validators.maxLength(500)]],
    songArtist: ['', [Validators.maxLength(100)]],
    songTitle:  ['', [Validators.maxLength(100)]],
    profilePicture: ['']
  });

  ngOnInit(): void {
    this.store.select(selectIsAdmin).pipe(take(1)).subscribe(admin => {
      this.isAdmin.set(admin);
    });

    this.store.select(selectCurrentUser).pipe(take(1)).subscribe(user => {
      if (user) {
        const { artist, title } = this.parseCurrentSong(user.currentSong ?? '');
        this.form.patchValue({
          bio: user.bio ?? '',
          songArtist: artist,
          songTitle: title
        });
        this.selectedGenres.set(user.musicGenres ?? []);
        if (user.profilePicture) {
          this.form.patchValue({ profilePicture: user.profilePicture });
        }
      }
    });
  }

  openPreview(): void {
    this.store.select(selectCurrentUser).pipe(take(1)).subscribe(user => {
      this.previewProfile.set({
        id: user?.id ?? '',
        alias: user?.alias ?? '',
        bio: this.form.value.bio || undefined,
        profilePicture: this.form.value.profilePicture || undefined,
        currentSong: this.buildCurrentSong() || undefined,
        musicGenres: this.selectedGenres()
      });
      this.previewOpen.set(true);
    });
  }

  private parseCurrentSong(value: string): { artist: string; title: string } {
    if (!value) return { artist: '', title: '' };
    const match = value.match(/^(.+?) - '(.+)'$/);
    if (match) return { artist: match[1], title: match[2] };
    // Fallback para valores sin el formato esperado
    const idx = value.indexOf(' - ');
    if (idx !== -1) return { artist: value.slice(0, idx), title: value.slice(idx + 3) };
    return { artist: value, title: '' };
  }

  buildCurrentSong(): string {
    const artist = (this.form.value.songArtist ?? '').trim();
    const title  = (this.form.value.songTitle  ?? '').trim();
    if (artist && title) return `${artist} - '${title}'`;
    if (artist) return artist;
    if (title)  return `'${title}'`;
    return '';
  }

  toggleGenre(genre: string): void {
    const current = this.selectedGenres();
    if (current.includes(genre)) {
      this.selectedGenres.set(current.filter(g => g !== genre));
    } else {
      this.selectedGenres.set([...current, genre]);
    }
  }

  isSelected(genre: string): boolean {
    return this.selectedGenres().includes(genre);
  }

  removePhoto(): void {
    this.form.patchValue({ profilePicture: '' });
    this.showUrlInput.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    // Admin only saves the profile picture
    const dto = this.isAdmin()
      ? { profilePicture: this.form.value.profilePicture || undefined }
      : {
          bio: this.form.value.bio ?? undefined,
          currentSong: this.buildCurrentSong() || undefined,
          musicGenres: this.selectedGenres(),
          profilePicture: this.form.value.profilePicture || undefined
        };

    this.profileService.updatePublicProfile(dto).subscribe({
      next: (updated) => {
        this.store.dispatch(updateUser({ user: updated }));
        this.saving.set(false);
        const msg = this.isAdmin() ? 'Foto actualizada' : 'Perfil actualizado';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: 'snack-success' });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Error al guardar los cambios', 'Cerrar', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }
}
