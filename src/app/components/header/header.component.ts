import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule,TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ TranslateModule, CommonModule ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  dropdownOpen = false; // Controla si el menú desplegable está abierto
  languages = [
    { code: 'es', label: 'Spanish' },
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
  ];

  constructor(private translate: TranslateService) {}

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen; // Alternar el estado del menú desplegable
  }

  changeLanguage(lang: { code: string; label: string }): void {
    this.translate.use(lang.code); // Cambiar el idioma usando ngx-translate
    this.dropdownOpen = false; // Cerrar el menú desplegable después de seleccionar un idioma
  }
}
