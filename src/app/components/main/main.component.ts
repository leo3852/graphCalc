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

  showIntersections: boolean = false; // Controla si se muestran los puntos de corte con los ejes
  gridLineDensity: number = 10; // Controla la densidad de las líneas de la cuadrícula
  showSettings: boolean = false; // Controla si se muestran las configuraciones
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

  // modifyGridLines(): void {
  //   if (this.chart) {
  //     // Alternar entre más líneas y menos líneas ajustando el stepSize
  //     const currentStepSize = (this.chart.options.scales?.["x"]?.ticks as any)?.stepSize || 1;
  
  //     if (currentStepSize === 1) {
  //       // Más líneas (reducir el stepSize)
  //       if (this.chart?.options?.scales?.["x"]) {
  //         this.chart.options.scales["x"].ticks = { stepSize: 0.5 }; // Ajustar stepSize para el eje X
  //       }
  //       if (this.chart.options.scales?.["y"]) {
  //         this.chart.options.scales["y"].ticks = { stepSize: 0.5 }; // Ajustar stepSize para el eje Y
  //       }
  //     } else {
  //       // Menos líneas (restaurar el stepSize original)
  //       if (this.chart?.options?.scales?.["x"]) {
  //         this.chart.options.scales["x"].ticks = { stepSize: 1 }; // Restaurar stepSize para el eje X
  //       }
  //       if (this.chart?.options?.scales?.["y"]) {
  //         this.chart.options.scales["y"].ticks = { stepSize: 1 }; // Restaurar stepSize para el eje Y
  //       }
  //     }
  
  //     this.chart.update(); // Actualizar la gráfica
  //   }
  // }
  
  calculateIntersections(): { x: number; y: number }[] {
    const intersections: { x: number; y: number }[] = [];

    if (this.graphType === 'lineal') {
      // Para una línea recta: y = mx + b
      const { m, b } = this.calculateLinearRegression(this.values);

      // Corte con el eje Y (x = 0)
      intersections.push({ x: 0, y: b });

      // Corte con el eje X (y = 0)
      if (m !== 0) {
        const xIntercept = -b / m;
        intersections.push({ x: xIntercept, y: 0 });
      }
    } else if (this.graphType === 'polynomial') {
      // Para una parábola: y = ax² + bx + c
      const { a, b, c } = this.calculatePolynomialRegression(this.values);

      // Resolver para y = 0 (corte con el eje X)
      const discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) {
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        intersections.push({ x: x1, y: 0 });
        intersections.push({ x: x2, y: 0 });
      }

      // Corte con el eje Y (x = 0)
      intersections.push({ x: 0, y: c });
    } else if (this.graphType === 'exponencial') {
      // Para una exponencial: y = A * B^x
      const { A } = this.calculateExponentialRegression(this.values);

      // Corte con el eje Y (x = 0)
      intersections.push({ x: 0, y: A });
    } else if (this.graphType === 'logaritmica') {
      // Para una logarítmica: y = A + B * ln(x)
      const transformedValues = this.values.map(pair => ({ x: Math.log(pair.x), y: pair.y }));
      const { m: B, b: A } = this.calculateLinearRegression(transformedValues);
  
      // Corte con el eje X (y = 0)
      if (B !== 0) {
        const xIntercept = Math.exp(-A / B); // x = e^(-A / B)
        if (xIntercept > 0) {
          intersections.push({ x: xIntercept, y: 0 });
        }
      }
  
      // Nota: No hay corte con el eje Y porque ln(x) no está definido para x ≤ 0
    } else if (this.graphType === 'inversa') {
      // Para una inversa: y = A / x
      const sumXInv = this.values.reduce((acc, pair) => acc + 1 / pair.x, 0);
      const sumY = this.values.reduce((acc, pair) => acc + pair.y, 0);
      const A = sumY / sumXInv; 

      // Corte con el eje Y (x = 0 no está definido, no hay intersección)
      // Corte con el eje X (y = 0 no ocurre para una inversa)
      // No se agregan puntos de intersección para esta gráfica
    }

    return intersections;
  }

  addIntersectionPoints(points: { x: number; y: number }[]): void {
    if (this.chart) {
      // Eliminar cualquier dataset existente de puntos de corte
      this.removeIntersectionPoints();
  
      // Agregar un nuevo dataset para los puntos de corte
      this.chart.data.datasets.push({
        label: 'Puntos de corte',
        data: points,
        backgroundColor: 'black',
        borderColor: 'black',
        pointRadius: 5,
        showLine: false, // No conectar los puntos con una línea
      });
    }
  }

  removeIntersectionPoints(): void {
    if (this.chart) {
      // Filtrar para eliminar el dataset de los puntos de corte
      this.chart.data.datasets = this.chart.data.datasets.filter(
        (dataset) => dataset.label !== 'Puntos de corte'
      );
    }
  }

  updateIntersections(): void {
    if (this.chart) {
      if (this.showIntersections) {
        // Calcular y mostrar los puntos de corte
        const intersectionPoints = this.calculateIntersections();
        this.addIntersectionPoints(intersectionPoints);
      } else {
        // Eliminar los puntos de corte
        this.removeIntersectionPoints();
      }
      this.chart.update(); // Actualizar la gráfica
    }
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings; // Alterna la visibilidad de las configuraciones
  }

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

    // Calcular los límites de los puntos originales
    const originalMinX = Math.min(...this.values.map((pair) => pair.x));
    const originalMaxX = Math.max(...this.values.map((pair) => pair.x));
    const originalMinY = Math.min(...this.values.map((pair) => pair.y));
    const originalMaxY = Math.max(...this.values.map((pair) => pair.y));

    // Agregar un margen alrededor de los puntos originales
    const marginX = (originalMaxX - originalMinX) * 0.2; // 20% de margen
    const marginY = (originalMaxY - originalMinY) * 0.2; // 20% de margen

    let initialMinX = originalMinX - marginX;
    let initialMaxX = originalMaxX + marginX;
    let initialMinY = originalMinY - marginY;
    let initialMaxY = originalMaxY + marginY;

    // Respetar la lógica de startFromZero
    if (this.startFromZero) {
      initialMinX = 0;
      initialMinY = 0;
    }

    // Calcular los rangos de los ejes
    const rangeX = initialMaxX - initialMinX;
    const rangeY = initialMaxY - initialMinY;

    // Ajustar los rangos para que sean proporcionales
    const maxRange = Math.max(rangeX, rangeY);
    initialMaxX = initialMinX + maxRange;
    initialMaxY = initialMinY + maxRange;

    this.chart = new Chart(ctx, {
      type: 'scatter', // Cambiar el tipo de gráfico a 'scatter'
      data: {
        datasets: [
          {
            label: 'Datos',
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
              text: `${this.labelX} (${this.unitX ? this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinX, // Usar los límites iniciales centrados en los puntos originales
            max: initialMaxX,
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
              text: `${this.labelY} (${this.unitY ? this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinY, // Usar los límites iniciales centrados en los puntos originales
            max: initialMaxY,
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

    // Calcular los límites de los puntos originales
    const originalMinX = Math.min(...this.values.map((pair) => pair.x));
    const originalMaxX = Math.max(...this.values.map((pair) => pair.x));
    const originalMinY = Math.min(...this.values.map((pair) => pair.y));
    const originalMaxY = Math.max(...this.values.map((pair) => pair.y));

    // Agregar un margen alrededor de los puntos originales
    const marginX = (originalMaxX - originalMinX) * 0.2; // 20% de margen
    const marginY = (originalMaxY - originalMinY) * 0.2; // 20% de margen

    let initialMinX = originalMinX - marginX;
    let initialMaxX = originalMaxX + marginX;
    let initialMinY = originalMinY - marginY;
    let initialMaxY = originalMaxY + marginY;

    // Respetar la lógica de startFromZero
    if (this.startFromZero) {
      initialMinX = 0;
      initialMinY = 0;
    }

    // Calcular los rangos de los ejes
    const rangeX = initialMaxX - initialMinX;
    const rangeY = initialMaxY - initialMinY;

    // Ajustar los rangos para que sean proporcionales
    const maxRange = Math.max(rangeX, rangeY);
    initialMaxX = initialMinX + maxRange;
    initialMaxY = initialMinY + maxRange;

    // Calcular los extremos del eje X para extender la línea
    const extendedMinX = initialMinX - 100; // Extender 100 unidades hacia la izquierda
    const extendedMaxX = initialMaxX + 100; // Extender 100 unidades hacia la derecha

    // Generar puntos adicionales para extender la línea
    const extendedLineData = [
      { x: extendedMinX, y: m * extendedMinX + b },
      { x: extendedMaxX, y: m * extendedMaxX + b }
    ];

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
            data: extendedLineData, // Usar los puntos extendidos para la línea
            borderColor: 'blue',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0, // No mostrar puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0, // Línea recta
// clip: false // Permitir que la línea se dibuje fuera del área visible
          },
          {
            label: 'Datos',
            data: this.values, // Mostrar los puntos originales
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
              text: `${this.labelX} (${this.unitX ? this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinX, // Usar los límites iniciales centrados en los puntos originales
            max: initialMaxX,
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
              text: `${this.labelY} (${this.unitY ? this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinY, // Usar los límites iniciales centrados en los puntos originales
            max: initialMaxY,
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

    // Actualizar los puntos de corte si el toggle está activado
    this.updateIntersections();
  }

  generatePolynomialGraph(): void {
    this.graphType = 'polynomial';
    const { a, b, c } = this.calculatePolynomialRegression(this.values);
  
    // Generar la ecuación polinómica con manejo de signos
    this.equation = `y = ${a.toFixed(2)}x² ${b >= 0 ? '+ ' : '- '}${Math.abs(b).toFixed(2)}x ${c >= 0 ? '+ ' : '- '}${Math.abs(c).toFixed(2)}`;
  
    // Calcular los límites de los puntos originales
    const originalMinX = Math.min(...this.values.map((pair) => pair.x));
    const originalMaxX = Math.max(...this.values.map((pair) => pair.x));
    const originalMinY = Math.min(...this.values.map((pair) => pair.y));
    const originalMaxY = Math.max(...this.values.map((pair) => pair.y));
  
    // Agregar un margen alrededor de los puntos originales
    const marginX = (originalMaxX - originalMinX) * 0.2; // 20% de margen
    const marginY = (originalMaxY - originalMinY) * 0.2; // 20% de margen
  
    let initialMinX = originalMinX - marginX;
    let initialMaxX = originalMaxX + marginX;
    let initialMinY = originalMinY - marginY;
    let initialMaxY = originalMaxY + marginY;
  
    // Respetar la lógica de startFromZero
    if (this.startFromZero) {
      initialMinX = 0;
      initialMinY = 0;
    }
  
    // Calcular los rangos de los ejes
    const rangeX = initialMaxX - initialMinX;
    const rangeY = initialMaxY - initialMinY;
  
    // Ajustar los rangos para que sean proporcionales
    const maxRange = Math.max(rangeX, rangeY);
    initialMaxX = initialMinX + maxRange;
    initialMaxY = initialMinY + maxRange;
  
    // Calcular los extremos del eje X para extender la curva
    const extendedMinX = initialMinX - 10; // Extender 10 unidades hacia la izquierda
    const extendedMaxX = initialMaxX + 10; // Extender 10 unidades hacia la derecha
  
    // Generar puntos de la curva polinómica (100 puntos entre extendedMinX y extendedMaxX)
    const labels = Array.from({ length: 100 }, (_, i) => extendedMinX + (i * (extendedMaxX - extendedMinX) / 99));
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
          },
          {
            label: 'Datos',
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
              text: `${this.labelX} (${this.unitX ? this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinX,
            max: initialMaxX, // Forzar que el eje x termine en el máximo valor ajustado
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
              text: `${this.labelY} (${this.unitY ? this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinY,
            max: initialMaxY, // Forzar que el eje y termine en el máximo valor ajustado
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

    // Actualizar los puntos de corte si el toggle está activado
    this.updateIntersections();
  }

  generateExponentialGraph(): void {
    this.graphType = 'exponencial';
  
    // Verificar si hay suficientes datos para calcular la regresión
    if (this.values.length < 2) {
      console.error('Se necesitan al menos dos puntos para calcular la regresión exponencial.');
      return;
    }
  
    // Calcular los coeficientes de la regresión exponencial
    const { A, B } = this.calculateExponentialRegression(this.values);
  
    // Generar la ecuación exponencial
    this.equation = `y = ${A.toFixed(6)} * ${B.toFixed(6)}^x`;
  
    console.log('Ecuación generada:', this.equation);
  
    // Calcular los límites de los puntos originales
    const originalMinX = Math.min(...this.values.map((pair) => pair.x));
    const originalMaxX = Math.max(...this.values.map((pair) => pair.x));
    const originalMinY = Math.min(...this.values.map((pair) => pair.y));
    const originalMaxY = Math.max(...this.values.map((pair) => pair.y));
  
    // Agregar un margen alrededor de los puntos originales
    const marginX = (originalMaxX - originalMinX) * 0.2; // 20% de margen
    const marginY = (originalMaxY - originalMinY) * 0.2; // 20% de margen
  
    let initialMinX = originalMinX - marginX;
    let initialMaxX = originalMaxX + marginX;
    let initialMinY = originalMinY - marginY;
    let initialMaxY = originalMaxY + marginY;
  
    // Respetar la lógica de startFromZero
    if (this.startFromZero) {
      initialMinX = 0;
      initialMinY = 0;
    }
  
    // Calcular los rangos de los ejes
    const rangeX = initialMaxX - initialMinX;
    const rangeY = initialMaxY - initialMinY;
  
    // Ajustar los rangos para que sean proporcionales
    const maxRange = Math.max(rangeX, rangeY);
    initialMaxX = initialMinX + maxRange;
    initialMaxY = initialMinY + maxRange;
  
    // Calcular los extremos del eje X para extender la curva
    const extendedMinX = initialMinX - 10; // Extender 10 unidades hacia la izquierda
    const extendedMaxX = initialMaxX + 10; // Extender 10 unidades hacia la derecha
  
    // Generar puntos de la curva exponencial (100 puntos entre extendedMinX y extendedMaxX)
    const labels = Array.from({ length: 100 }, (_, i) => extendedMinX + (i * (extendedMaxX - extendedMinX) / 99));
    const exponentialData = labels.map((x) => ({ x, y: A * Math.pow(B, x) })); // Generar puntos de la curva exponencial
  
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
            data: exponentialData, // Puntos calculados de la curva exponencial
            borderColor: 'green',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0, // No mostrar puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0.4, // Curva suave
          },
          {
            label: 'Datos',
            data: this.values, // Mostrar los puntos originales
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
              text: `${this.labelX} (${this.unitX ? this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinX,
            max: initialMaxX, // Forzar que el eje x termine en el máximo valor ajustado
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
              text: `${this.labelY} (${this.unitY ? this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinY,
            max: initialMaxY, // Forzar que el eje y termine en el máximo valor ajustado
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

    // Actualizar los puntos de corte si el toggle está activado
    this.updateIntersections();
  }

  generateLogaritmicGraph(): void {
    this.graphType = 'logaritmica';
  
    // Verificar si hay suficientes datos para calcular la regresión
    if (this.values.length < 2) {
      console.error('Se necesitan al menos dos puntos para calcular la regresión logarítmica.');
      return;
    }
  
    // Transformar x a ln(x) y calcular la regresión lineal
    const transformedValues = this.values.map(pair => ({ x: Math.log(pair.x), y: pair.y }));
    const { m: B, b: A } = this.calculateLinearRegression(transformedValues);
  
    // Generar la ecuación logarítmica
    this.equation = `y = ${A.toFixed(6)} ${B >= 0 ? '+ ' : '- '} ${Math.abs(B).toFixed(6)} * ln(x)`;
  
    // Calcular el punto de corte con el eje X (y = 0)
    let xIntercept = null;
    if (B !== 0) {
      xIntercept = Math.exp(-A / B); // x = e^(-A / B)
    }
  
    // Calcular los límites de los puntos originales
    const originalMinX = Math.min(...this.values.map((pair) => pair.x));
    const originalMaxX = Math.max(...this.values.map((pair) => pair.x));
    const originalMinY = Math.min(...this.values.map((pair) => pair.y));
    const originalMaxY = Math.max(...this.values.map((pair) => pair.y));
  
    // Agregar un margen alrededor de los puntos originales
    const marginX = (originalMaxX - originalMinX) * 0.2; // 20% de margen
    const marginY = (originalMaxY - originalMinY) * 0.2; // 20% de margen
  
    let initialMinX = Math.max(0.1, originalMinX - marginX); // Evitar valores <= 0
    let initialMaxX = originalMaxX + marginX;
    let initialMinY = originalMinY - marginY;
    let initialMaxY = originalMaxY + marginY;
  
    // Respetar la lógica de startFromZero
    if (this.startFromZero) {
      initialMinX = 0.1; // Evitar valores <= 0
      initialMinY = 0;
    }
  
    // Extender el eje X para incluir el punto de corte con el eje X y un poco más
    if (xIntercept && xIntercept > 0) {
      initialMinX = Math.min(initialMinX, xIntercept * 0.8); // Extender hacia la izquierda
      initialMaxX = Math.max(initialMaxX, xIntercept * 1.2); // Extender hacia la derecha
    }
  
    // Calcular los rangos de los ejes
    const rangeX = initialMaxX - initialMinX;
    const rangeY = initialMaxY - initialMinY;
  
    // Ajustar los rangos para que sean proporcionales
    const maxRange = Math.max(rangeX, rangeY);
    initialMaxX = initialMinX + maxRange;
    initialMaxY = initialMinY + maxRange;
  
    // Generar puntos de la curva logarítmica (200 puntos entre initialMinX y initialMaxX)
    const labels = Array.from({ length: 200 }, (_, i) => initialMinX + (i * (initialMaxX - initialMinX) / 199));
    const logaritmicData = labels
      .filter(x => x > 0) // Evitar valores negativos o cero para x, ya que ln(x) no está definido
      .map((x) => ({ x, y: A + B * Math.log(x) })); // Generar puntos de la curva logarítmica
  
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
            data: logaritmicData, // Puntos calculados de la curva logarítmica
            borderColor: 'orange',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0, // No mostrar puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0.4, // Curva suave
          },
          {
            label: 'Datos',
            data: this.values, // Mostrar los puntos originales
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
              text: `${this.labelX} (${this.unitX ? this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinX,
            max: initialMaxX, // Forzar que el eje x termine en el máximo valor ajustado
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
              text: `${this.labelY} (${this.unitY ? this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinY,
            max: initialMaxY, // Forzar que el eje y termine en el máximo valor ajustado
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
  
    // Actualizar los puntos de corte si el toggle está activado
    this.updateIntersections();
  }
  
  generateInversaGraph(): void {
    this.graphType = 'inversa';
  
    // Verificar si hay suficientes datos para calcular la regresión
    if (this.values.length < 2) {
      console.error('Se necesitan al menos dos puntos para calcular la regresión inversa.');
      return;
    }
  
    // Calcular el coeficiente A para la ecuación y = A * 1/x
    const sumXInv = this.values.reduce((acc, pair) => acc + 1 / pair.x, 0);
    const sumY = this.values.reduce((acc, pair) => acc + pair.y, 0);
    const A = sumY / sumXInv;
  
    // Generar la ecuación inversa
    this.equation = `y = ${A.toFixed(6)} * 1/x`;

    // Calcular los límites de los puntos originales
    const originalMinX = Math.min(...this.values.map((pair) => pair.x));
    const originalMaxX = Math.max(...this.values.map((pair) => pair.x));
    const originalMinY = Math.min(...this.values.map((pair) => pair.y));
    const originalMaxY = Math.max(...this.values.map((pair) => pair.y));
  
    // Agregar un margen alrededor de los puntos originales
    const marginX = (originalMaxX - originalMinX) * 0.2; // 20% de margen
    const marginY = (originalMaxY - originalMinY) * 0.2; // 20% de margen
  
    let initialMinX = originalMinX - marginX;
    let initialMaxX = originalMaxX + marginX;
    let initialMinY = originalMinY - marginY;
    let initialMaxY = originalMaxY + marginY;
  
    // Respetar la lógica de startFromZero
    if (this.startFromZero) {
      initialMinX = 0;
      initialMinY = 0;
    }
  
    // Calcular los rangos de los ejes
    const rangeX = initialMaxX - initialMinX;
    const rangeY = initialMaxY - initialMinY;
  
    // Ajustar los rangos para que sean proporcionales
    const maxRange = Math.max(rangeX, rangeY);
    initialMaxX = initialMinX + maxRange;
    initialMaxY = initialMinY + maxRange;
  
    // Calcular los extremos del eje X para extender la curva
    const extendedMinX = initialMinX - 10; // Extender 10 unidades hacia la izquierda
    const extendedMaxX = initialMaxX + 10; // Extender 10 unidades hacia la derecha
  
    // Generar puntos de la curva inversa (100 puntos entre extendedMinX y extendedMaxX)
    const labels = Array.from({ length: 100 }, (_, i) => extendedMinX + (i * (extendedMaxX - extendedMinX) / 99));
    const inversaData = labels.map((x) => ({ x, y: A / x })); // Generar puntos de la curva inversa
  
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
            data: inversaData, // Puntos calculados de la curva inversa
            borderColor: 'purple',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0, // No mostrar puntos
            showLine: true, // Conectar los puntos con una línea
            tension: 0.4, // Curva suave
          },
          {
            label: 'Datos',
            data: this.values, // Mostrar los puntos originales
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
              text: `${this.labelX} (${this.unitX ? this.unitX : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinX,
            max: initialMaxX, // Forzar que el eje x termine en el máximo valor ajustado
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
              text: `${this.labelY} (${this.unitY ? this.unitY : 'Unidad'})` // Mostrar etiqueta con unidad
            },
            min: initialMinY,
            max: initialMaxY, // Forzar que el eje y termine en el máximo valor ajustado
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

    // Actualizar los puntos de corte si el toggle está activado
    this.updateIntersections();
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
  
    // Verificar que no haya valores de y <= 0
    if (values.some(pair => pair.y <= 0)) {
      throw new Error('Todos los valores de y deben ser mayores que 0 para calcular la regresión exponencial.');
    }
  
    // Transformar y a ln(y)
    const sumX = values.reduce((acc, pair) => acc + pair.x, 0);
    const sumLnY = values.reduce((acc, pair) => acc + Math.log(pair.y), 0);
    const sumX2 = values.reduce((acc, pair) => acc + pair.x * pair.x, 0);
    const sumXlnY = values.reduce((acc, pair) => acc + pair.x * Math.log(pair.y), 0);
  
    // Calcular los coeficientes de la regresión lineal
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
      throw new Error('No se puede calcular la regresión exponencial: denominador es 0.');
    }
  
    const lnA = (sumLnY * sumX2 - sumX * sumXlnY) / denominator;
    const lnB = (n * sumXlnY - sumX * sumLnY) / denominator;
  
    const A = Math.exp(lnA); // Convertir ln(A) a A
    const B = Math.exp(lnB); // Convertir ln(B) a B
  
    return { A, B };
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
