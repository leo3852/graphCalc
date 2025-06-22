import { CommonModule } from '@angular/common';
import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart,registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

@Component({
  selector: 'app-main',
  imports: [CommonModule, FormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements AfterViewInit {

  canvasWidth: number = 600; // Tamaño inicial para pantallas grandes
  canvasHeight: number = 600;

  
  startFromZero: boolean = false; // Controla si los ejes comienzan desde 0
  equation: string = ''; // Propiedad para almacenar la ecuación generada
  
  currentStep = 1; // Controla el paso actual
  labelX = '';
  labelY = '';
  unitX: string = ''; // Unidad de medida para el eje X
  unitY: string = ''; // Unidad de medida para el eje Y
  showError: boolean = false;
  valueX: number | null = null;
  valueY: number | null = null;
  values: { x: number, y: number }[] = []; // Almacena los pares de valores X e Y
  chart: Chart | null = null;
  graphType: any;
  
  constructor() {
    // Registrar todos los componentes necesarios de Chart.js
    Chart.register(...registerables,zoomPlugin);
  }
  
  ngOnInit(): void {
    this.updateCanvasSize(); // Ajustar el tamaño del canvas al cargar
    window.addEventListener('resize', this.updateCanvasSize.bind(this)); // Detectar cambios en el tamaño de la ventana
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.updateCanvasSize.bind(this)); // Eliminar el listener al destruir el componente
  }

  // updateCanvasSize(): void {
  //   if (window.innerWidth < 768) {
  //     this.canvasWidth = 300;
  //     this.canvasHeight = 300;
  //   } if (window.innerWidth < 1024) {
  //     this.canvasWidth = window.innerWidth - 600;
  //     this.canvasHeight = window.innerWidth - 600;
  //   } if (window.innerWidth < 1300) {
  //     this.canvasWidth = window.innerWidth - 900;
  //     this.canvasHeight = window.innerWidth - 900;
  //   }
  // }
  updateCanvasSize(): void {
    const container = document.getElementById('chartContainer'); // Asegúrate de que el contenedor tenga un ID
    if (container) {
      // Ajustar el tamaño del canvas al ancho del contenedor
      this.canvasWidth = container.offsetWidth;
      this.canvasHeight = container.offsetWidth; // Mantener una proporción razonable
    } else {
      // Fallback: usar el ancho de la ventana si no hay contenedor
      this.canvasWidth = Math.min(window.innerWidth - 50, 800); // Dejar un margen de 50px
      this.canvasHeight = Math.min(window.innerWidth - 50, 800); // Mantener una proporción razonable
    }
  }
  
  onUnitChange(event: Event, unitType: 'unitX' | 'unitY'): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement?.value || '';
    if (unitType === 'unitX') {
      this.unitX += value;
    } else if (unitType === 'unitY') {
      this.unitY += value;
    }
    // Restablecer el valor del select
    selectElement.value = "";
  }

  assignLabels(): void {
      if (!this.labelX || !this.labelY) {
        this.showError = true; // Mostrar mensajes de error si los inputs están vacíos
        return;
      }
      this.showError = false; // Ocultar mensajes de error si los inputs son válidos
      this.currentStep = 2; // Avanzar al siguiente paso
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

  generateGraph() {
    this.graphType = 'lineal';
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
        responsive: false, // Desactivar para que la gráfica no se ajuste al tamaño del contenedor
        maintainAspectRatio: false, // Permitir que la gráfica ocupe todo el espacio disponible
        plugins: {
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true, // Habilitar el movimiento (pan)
              mode: 'xy', // Permitir mover en ambos ejes (x e y)
            },
            zoom: {
              wheel: {
                enabled: true // Habilitar zoom con la rueda del ratón
              },
              pinch: {
                enabled: true // Habilitar zoom con gestos táctiles
              },
              mode: 'xy', // Permitir zoom en ambos ejes (x e y)
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `${this.labelX} (${this.unitX ?this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: 0 // Forzar que el eje x comience en 0
          },
          y: {
            title: {
              display: true,
              text: `${this.labelY} (${this.unitY ? this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: 0 // Forzar que el eje y comience en 0
          }
        }
      }
    });
  }

  resetForm() {
    this.currentStep = 1; // Regresa al paso 1
    this.values = []; // Limpia los valores
    this.labelX = ''; // Limpia la etiqueta X
    this.labelY = ''; // Limpia la etiqueta Y
    this.unitX = ''; // Limpia la unidad de medida X
    this.unitY = ''; // Limpia la unidad de medida Y
  }

  generateLinearGraph(): void {
    this.graphType = 'lineal';
    const { m, b } = this.calculateLinearRegression(this.values);

    // Generar la ecuación lineal con manejo de signos
    this.equation = `y = ${m.toFixed(2)}x ${b >= 0 ? '+ ' : '- '}${Math.abs(b).toFixed(2)}`;
  
    // Calcular los mínimos adecuados para los ejes si startFromZero está en true
    const minX = !this.startFromZero ? Math.min(...this.values.map((pair) => pair.x)) : 0;
    const minY = !this.startFromZero ? Math.min(...this.values.map((pair) => pair.y)) : 0;
    const maxX = Math.max(...this.values.map((pair) => pair.x)) + 10; // Aumentar el máximo de X para extender la línea
    // Generar puntos adicionales para extender la línea
    const extendedLineData = [
      { x: minX, y: m * minX + b },
      { x: maxX, y: m * maxX + b }
    ];

    //const regressionData = this.values.map((pair) => ({ x: pair.x, y: m * pair.x + b })); // y = mx + b

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
            label: this.equation,
            data: extendedLineData, // Mantener los valores { x, y }
            borderColor: 'blue',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0, // Tamaño de los puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0, // Línea recta
            clip: false // Permitir que la línea se dibuje fuera del área visible
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
        responsive: false, // Desactivar la opción responsive
        maintainAspectRatio: false, // Permitir que la gráfica ocupe todo el espacio disponible
        plugins: {
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true, // Habilitar el movimiento (pan)
              mode: 'xy', // Permitir mover en ambos ejes (x e y)
            },
            zoom: {
              wheel: {
                enabled: true // Habilitar zoom con la rueda del ratón
              },
              pinch: {
                enabled: true // Habilitar zoom con gestos táctiles
              },
              mode: 'xy', // Permitir zoom en ambos ejes (x e y)
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `${this.labelX} (${this.unitX ?this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: minX,
            grid: {
              drawTicks: true,
              color: (context) => {
                return context.tick.value === 0 ? 'black' : '#e0e0e0'; // Eje X en gris oscuro en 0
              }
            }
          },
          y: {
            title: {
              display: true,
              text: `${this.labelY} (${this.unitY ?this.unitY :'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: minY,
            grid: {
              drawTicks: true,
              color: (context) => {
                return context.tick.value === 0 ? 'black' : '#e0e0e0'; // Eje Y en gris oscuro en 0
              }
            }
          }
        }
      }
    });
  }

  generatePolynomialGraph(): void {
    this.graphType = 'polynomial';
    const { a, b, c } = this.calculatePolynomialRegression(this.values);

    // Generar la ecuación polinómica con manejo de signos
    this.equation = `y = ${a.toFixed(2)}x² ${b >= 0 ? '+ ' : '- '}${Math.abs(b).toFixed(2)}x ${c >= 0 ? '+ ' : '- '}${Math.abs(c).toFixed(2)}`;

    const minX = !this.startFromZero ? Math.min(...this.values.map((pair) => pair.x)) : 0;
    const minY = !this.startFromZero ? Math.min(...this.values.map((pair) => pair.y)) : 0;

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
            pointRadius: 0, // Tamaño de los puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0.4, // Curva suave
            clip: false
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
        responsive: false, // Desactivar la opción responsive
        maintainAspectRatio: false, // Permitir que la gráfica ocupe todo el espacio disponible
        plugins: {
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true, // Habilitar el movimiento (pan)
              mode: 'xy', // Permitir mover en ambos ejes (x e y)
            },
            zoom: {
              wheel: {
                enabled: true // Habilitar zoom con la rueda del ratón
              },
              pinch: {
                enabled: true // Habilitar zoom con gestos táctiles
              },
              mode: 'xy', // Permitir zoom en ambos ejes (x e y)
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `${this.labelX} (${this.unitX ?this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: minX,
            max: maxX, // Forzar que el eje x termine en el máximo valor
            grid: {
              drawTicks: true,
              color: (context) => {
                return context.tick.value === 0 ? 'black' : '#e0e0e0'; // Eje Y en gris oscuro en 0
              }
            }
          },
          y: {
            title: {
              display: true,
              text: `${this.labelY} (${this.unitY ?this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: minY,
            max: maxY, // Forzar que el eje y termine en el máximo valor
            grid: {
              drawTicks: true,
              color: (context) => {
                return context.tick.value === 0 ? 'black' : '#e0e0e0'; // Eje Y en gris oscuro en 0
              }
            }
          }
        }
      }
    });
  }

  generateExponentialGraph(): void {
    this.graphType = 'exponencial';
    const { A, B, C } = this.calculateExponentialRegression(this.values);

    // Generar la ecuación exponencial
    this.equation = `y = ${A.toFixed(2)} * e^(${B.toFixed(4)}x) ${C >= 0 ? '+ ' : '- '} ${Math.abs(C).toFixed(4)}`;

    const minX = !this.startFromZero ? Math.min(...this.values.map((pair) => pair.x)) : 0;
    const minY = !this.startFromZero ? Math.min(...this.values.map((pair) => pair.y)) : 0;

    const maxX = Math.max(...this.values.map((pair) => pair.x));
    const maxY = Math.max(...this.values.map((pair) => pair.y));
    const labels = Array.from({ length: Math.ceil((maxX - minX) / 10) + 1 }, (_, i) => minX + i * 10);
    const exponentialData = labels.map((x) => ({ x, y: A * Math.exp(B * x) + C })); // Generar puntos de la curva exponencial

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
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this.equation,
            data: exponentialData,
            borderColor: 'green',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            tension: 0.4,
            clip: false
          },
          {
            label: 'Puntos Originales',
            data: this.values,
            borderColor: 'red',
            backgroundColor: 'red',
            borderWidth: 0,
            pointRadius: 5,
            pointStyle: 'circle',
            showLine: false
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true, // Habilitar el movimiento (pan)
              mode: 'xy', // Permitir mover en ambos ejes (x e y)
            },
            zoom: {
              wheel: {
                enabled: true // Habilitar zoom con la rueda del ratón
              },
              pinch: {
                enabled: true // Habilitar zoom con gestos táctiles
              },
              mode: 'xy', // Permitir zoom en ambos ejes (x e y)
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `${this.labelX} (${this.unitX ?this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: minX,
            max: maxX,
            grid: {
              drawTicks: true,
              color: (context) => {
                return context.tick.value === 0 ? 'black' : '#e0e0e0';
              }
            }
          },
          y: {
            title: {
              display: true,
              text: `${this.labelY} (${this.unitY ?this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: minY,
            max: maxY,
            grid: {
              drawTicks: true,
              color: (context) => {
                return context.tick.value === 0 ? 'black' : '#e0e0e0';
              }
            }
          }
        }
      }
    });
  }
  

  generateLogaritmicGraph() {
    throw new Error('Method not implemented.');
  }
  
  generateInversaGraph() {
    throw new Error('Method not implemented.');
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

  calculateExponentialRegression(values: { x: number, y: number }[]): { A: number, B: number, C: number } {
    const n = values.length;
    const sumX = values.reduce((acc, pair) => acc + pair.x, 0);
    const sumY = values.reduce((acc, pair) => acc + pair.y, 0);
    const sumLnY = values.reduce((acc, pair) => acc + Math.log(pair.y), 0);
    const sumX2 = values.reduce((acc, pair) => acc + pair.x * pair.x, 0);
    const sumXlnY = values.reduce((acc, pair) => acc + pair.x * Math.log(pair.y), 0);
  
    // Configurar la matriz para resolver el sistema de ecuaciones
    const matrix = [
      [n, sumX, sumY, sumLnY],
      [sumX, sumX2, sumY, sumXlnY],
      [sumY, sumY, n, sumY]
    ];
  
    const [lnA, B, C] = this.solveLinearSystem(matrix); // Resolver el sistema de ecuaciones
    const A = Math.exp(lnA); // Convertir ln(A) a A
  
    return { A, B, C };
  }

  // solveLinearSystem(matrix: number[][]): number[] {
  //   const n = matrix.length;

  //   for (let i = 0; i < n; i++) {
  //     // Normalizar la fila actual
  //     for (let j = i + 1; j < n; j++) {
  //       const factor = matrix[j][i] / matrix[i][i];
  //       for (let k = i; k <= n; k++) {
  //         matrix[j][k] -= factor * matrix[i][k];
  //       }
  //     }
  //   }

  //   const result = new Array(n).fill(0);
  //   for (let i = n - 1; i >= 0; i--) {
  //     result[i] = matrix[i][n] / matrix[i][i];
  //     for (let j = i - 1; j >= 0; j--) {
  //       matrix[j][n] -= matrix[j][i] * result[i];
  //     }
  //   }

  //   return result;
  // }
  solveLinearSystem(matrix: number[][]): number[] {
    const n = matrix.length;
  
    for (let i = 0; i < n; i++) {
      // Encontrar el pivote máximo en la columna i
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(matrix[j][i]) > Math.abs(matrix[maxRow][i])) {
          maxRow = j;
        }
      }
  
      // Intercambiar filas si es necesario
      if (maxRow !== i) {
        const temp = matrix[i];
        matrix[i] = matrix[maxRow];
        matrix[maxRow] = temp;
      }
  
      // Verificar si el pivote es cero
      if (matrix[i][i] === 0) {
        throw new Error('El sistema no tiene solución única');
      }
  
      // Normalizar la fila actual
      for (let j = i + 1; j < n; j++) {
        const factor = matrix[j][i] / matrix[i][i];
        for (let k = i; k <= n; k++) {
          matrix[j][k] -= factor * matrix[i][k];
        }
      }
    }
  
    // Resolver el sistema por sustitución hacia atrás
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
  
  scrollToGraph(): void {
    setTimeout(() => {
      const graphElement = document.getElementById('chartCanvas');
      if (graphElement) {
        graphElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200); // Esperar un poco para asegurarse de que la gráfica se haya renderizado
  }
}
