import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/models';

@Component({
  selector: 'app-city-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-select.component.html',
  styleUrl: './city-select.component.scss'
})
export class CitySelectComponent {
  @Input() cities: City[] = [];
  @Input() selectedCity: City | null = null;
  @Input() loading = false;
  @Output() cityChange = new EventEmitter<City | null>();

  isOpen = false;
  searchText = '';

  constructor(private el: ElementRef) {}

  get filteredCities(): City[] {
    if (!this.searchText.trim()) return this.cities;
    const q = this.searchText.toLowerCase();
    return this.cities.filter(c => c.name.toLowerCase().includes(q));
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.searchText = '';
  }

  select(city: City | null): void {
    this.cityChange.emit(city);
    this.isOpen = false;
    this.searchText = '';
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
