import {
  Component, Input, Output, EventEmitter,
  HostListener, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, UpperCasePipe, SlicePipe } from '@angular/common';
import { PublicProfile } from '../../../core/services/profile.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, UpperCasePipe, SlicePipe],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileCardComponent {
  @Input({ required: true }) profile!: PublicProfile;
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('profile-card-overlay')) {
      this.close.emit();
    }
  }
}
