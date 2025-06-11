import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  imports: [CommonModule, FormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  labelX: string = '';
  labelY: string = '';

  assignLabels() {
    console.log(`Etiqueta X: ${this.labelX}, Etiqueta Y: ${this.labelY}`);
    // Aquí puedes agregar la lógica para actualizar la gráfica con las etiquetas
  }
}
