import { CommonModule } from '@angular/common';
import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart,registerables } from 'chart.js';

@Component({
  selector: 'app-main',
  imports: [CommonModule, FormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements AfterViewInit {
  equation: string = ''; // Propiedad para almacenar la ecuación generada

  currentStep = 1; // Controla el paso actual
  labelX = '';
  labelY = '';
  valueX: number | null = null;
  valueY: number | null = null;
  values: { x: number, y: number }[] = []; // Almacena los pares de valores X e Y
  chart: Chart | null = null;

  constructor() {
    // Registrar todos los componentes necesarios de Chart.js
    Chart.register(...registerables);
  }

  assignLabels() {
    if (this.labelX && this.labelY) {
      this.currentStep = 2; // Cambia al paso 2
    }
  }

  addValues() {
    if (this.valueX !== null && this.valueY !== null) {
      this.values.push({ x: this.valueX, y: this.valueY });
      this.valueX = null; // Limpia el campo de entrada
      this.valueY = null; // Limpia el campo de entrada
    }
  }

  removeValue(index: number): void {
    this.values.splice(index, 1);
  }

  resetForm() {
    this.currentStep = 1; // Regresa al paso 1
    this.values = []; // Limpia los valores
    this.labelX = ''; // Limpia la etiqueta X
    this.labelY = ''; // Limpia la etiqueta Y
  }

  generateLinearGraph(): void {
    const { m, b } = this.calculateLinearRegression(this.values);

    // Generar la ecuación lineal con manejo de signos
    this.equation = `y = ${m.toFixed(2)}x ${b >= 0 ? '+ ' : '- '}${Math.abs(b).toFixed(2)}`;

    const regressionData = this.values.map((pair) => ({ x: pair.x, y: m * pair.x + b })); // y = mx + b

    if (this.chart) {
      this.chart.destroy(); // Destruye la gráfica anterior si existe
    }

    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context');
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'scatter', // Cambiar el tipo de gráfico a 'scatter'
      data: {
        datasets: [
          {
            label: `Regresión Lineal: ${this.equation}`,
            data: regressionData, // Mantener los valores { x, y }
            borderColor: 'blue',
            backgroundColor: 'transparent',
            borderWidth: 2,
            showLine: true, // Conectar los puntos con una línea
            tension: 0 // Línea recta
          },
          {
            label: 'Puntos Originales',
            data: this.values, // Mantener los valores originales { x, y }
            borderColor: 'red',
            backgroundColor: 'red',
            borderWidth: 0,
            pointRadius: 5, // Tamaño de los puntos
            pointStyle: 'circle', // Estilo de los puntos
            showLine: false // No conectar los puntos con una línea
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: this.labelX
            },
            min: 0 // Forzar que el eje x comience en 0
          },
          y: {
            title: {
              display: true,
              text: this.labelY
            },
            min: 0 // Forzar que el eje y comience en 0
          }
        }
      }
    });
  }

  generatePolynomialGraph(): void {
    const { a, b, c } = this.calculatePolynomialRegression(this.values);

    // Generar la ecuación polinómica con manejo de signos
    this.equation = `y = ${a.toFixed(5)}x² ${b >= 0 ? '+ ' : '- '}${Math.abs(b).toFixed(5)}x ${c >= 0 ? '+ ' : '- '}${Math.abs(c).toFixed(5)}`;

    const minX = 0;
    const maxX = Math.max(...this.values.map((pair) => pair.x));
    const maxY = Math.max(...this.values.map((pair) => pair.y)); // Obtener el máximo valor de Y

    // Generar puntos de la curva polinómica (50 puntos entre minX y maxX)
    const labels = Array.from({ length: 50 }, (_, i) => minX + (i * (maxX - minX) / 49));
    const polynomialData = labels.map((x) => ({ x, y: a * x * x + b * x + c }));

    if (this.chart) {
      this.chart.destroy(); // Destruye la gráfica anterior si existe
    }

    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context');
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'scatter', // Mantener el tipo de gráfico como 'scatter'
      data: {
        datasets: [
          {
            label: this.equation, // Mostrar la ecuación como etiqueta
            data: polynomialData, // Puntos calculados de la curva polinómica
            borderColor: 'blue',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 1, // Tamaño de los puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0.4 // Curva suave
          },
          {
            label: 'Puntos Originales',
            data: this.values, // Mostrar los puntos originales { x, y }
            borderColor: 'red',
            backgroundColor: 'red',
            borderWidth: 0,
            pointRadius: 5, // Tamaño de los puntos
            pointStyle: 'circle', // Estilo de los puntos
            showLine: false // No conectar los puntos con una línea
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: this.labelX
            },
            min: minX, // Forzar que el eje x comience en el mínimo valor
            max: maxX // Forzar que el eje x termine en el máximo valor
          },
          y: {
            title: {
              display: true,
              text: this.labelY
            },
            min: 0, // Forzar que el eje y comience en 0
            max: maxY // Forzar que el eje y termine en el máximo valor
          }
        }
      }
    });
  }

  generateExponentialGraph(): void {
    const { A, B } = this.calculateExponentialRegression(this.values);

    // Generar la ecuación exponencial
    this.equation = `y = ${A.toFixed(2)} * e^(${B.toFixed(4)}x)`;

    const minX = 0; // Forzar que el eje x comience en 0
    const maxX = Math.max(...this.values.map((pair) => pair.x));
    const maxY = Math.max(...this.values.map((pair) => pair.y)); // Obtener el máximo valor de Y
    const labels = Array.from({ length: Math.ceil((maxX - minX) / 10) + 1 }, (_, i) => minX + i * 10);
    const exponentialData = labels.map((x) => ({ x, y: A * Math.exp(B * x) })); // Generar puntos de la curva exponencial

    if (this.chart) {
      this.chart.destroy(); // Destruye la gráfica anterior si existe
    }

    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context');
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'scatter', // Mantener el tipo de gráfico como 'scatter'
      data: {
        datasets: [
          {
            label: this.equation, // Mostrar la ecuación como etiqueta
            data: exponentialData, // Puntos calculados de la curva exponencial
            borderColor: 'green',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 1, // Tamaño de los puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0.4 // Curva suave
          },
          {
            label: 'Puntos Originales',
            data: this.values, // Mostrar los puntos originales { x, y }
            borderColor: 'red',
            backgroundColor: 'red',
            borderWidth: 0,
            pointRadius: 5, // Tamaño de los puntos
            pointStyle: 'circle', // Estilo de los puntos
            showLine: false // No conectar los puntos con una línea
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: this.labelX
            },
            min: minX, // Ajustar el eje x al mínimo valor
            max: maxX // Ajustar el eje x al máximo valor
          },
          y: {
            title: {
              display: true,
              text: this.labelY
            },
            min: 0, // Ajustar el eje y al mínimo valor
            max: maxY // Ajustar el eje y al máximo valor
          }
        }
      }
    });
  }
  

  calculateLinearRegression(values: { x: number, y: number }[]): { m: number, b: number } {
    const n = values.length;
    const sumX = values.reduce((acc, pair) => acc + pair.x, 0);
    const sumY = values.reduce((acc, pair) => acc + pair.y, 0);
    const sumXY = values.reduce((acc, pair) => acc + pair.x * pair.y, 0);
    const sumX2 = values.reduce((acc, pair) => acc + pair.x * pair.x, 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    return { m, b };
  }

  calculatePolynomialRegression(values: { x: number, y: number }[]): { a: number, b: number, c: number } {
    const n = values.length;
    const sumX = values.reduce((acc, pair) => acc + pair.x, 0);
    const sumX2 = values.reduce((acc, pair) => acc + pair.x * pair.x, 0);
    const sumX3 = values.reduce((acc, pair) => acc + pair.x * pair.x * pair.x, 0);
    const sumX4 = values.reduce((acc, pair) => acc + pair.x * pair.x * pair.x * pair.x, 0);
    const sumY = values.reduce((acc, pair) => acc + pair.y, 0);
    const sumXY = values.reduce((acc, pair) => acc + pair.x * pair.y, 0);
    const sumX2Y = values.reduce((acc, pair) => acc + pair.x * pair.x * pair.y, 0);

    // Resolver el sistema de ecuaciones para los coeficientes a, b, c
    const matrix = [
      [n, sumX, sumX2, sumY],
      [sumX, sumX2, sumX3, sumXY],
      [sumX2, sumX3, sumX4, sumX2Y]
    ];

    const [c, b, a] = this.solveLinearSystem(matrix); // Ajustar el orden de los coeficientes
    return { a, b, c };
  }

  calculateExponentialRegression(values: { x: number, y: number }[]): { A: number, B: number } {
    const n = values.length;
    const sumX = values.reduce((acc, pair) => acc + pair.x, 0);
    const sumLnY = values.reduce((acc, pair) => acc + Math.log(pair.y), 0);
    const sumX2 = values.reduce((acc, pair) => acc + pair.x * pair.x, 0);
    const sumXlnY = values.reduce((acc, pair) => acc + pair.x * Math.log(pair.y), 0);

    // Calcular B y ln(A)
    const B = (n * sumXlnY - sumX * sumLnY) / (n * sumX2 - sumX * sumX);
    const lnA = (sumLnY - B * sumX) / n;

    // Convertir ln(A) a A
    const A = Math.exp(lnA);

    return { A, B };
  }

  solveLinearSystem(matrix: number[][]): number[] {
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
      // Normalizar la fila actual
      for (let j = i + 1; j < n; j++) {
        const factor = matrix[j][i] / matrix[i][i];
        for (let k = i; k <= n; k++) {
          matrix[j][k] -= factor * matrix[i][k];
        }
      }
    }

    const result = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      result[i] = matrix[i][n] / matrix[i][i];
      for (let j = i - 1; j >= 0; j--) {
        matrix[j][n] -= matrix[j][i] * result[i];
      }
    }

    return result;
  }

  ngAfterViewInit(): void {
    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
  
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context');
      return;
    }
  
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true
      }
    });
  }
}
