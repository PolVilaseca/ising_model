// Global variables
let grid = [];
let N = 50;
let T = 2.5;
let canvas, ctx;
let isRunning = false;
let simulationInterval;
let stepCount = 0;

// Initialize the simulation and UI components
function init() {
  canvas = document.getElementById("isingCanvas");
  ctx = canvas.getContext("2d");
  N = parseInt(document.getElementById("gridSize").value);
  T = parseFloat(document.getElementById("temp").value);

  // Initialize grid and draw initial state
  initGrid();
  drawGrid();
  initPlot();

  // Temperature slider updates
  document.getElementById("temp").addEventListener("input", function() {
    T = parseFloat(this.value);
    document.getElementById("tempValue").textContent = T;
  });

  // Grid size input change resets simulation
  document.getElementById("gridSize").addEventListener("change", function() {
    N = parseInt(this.value);
    resetSimulation();
  });

  // Reset and Play/Pause button event listeners
  document.getElementById("reset").addEventListener("click", resetSimulation);
  document.getElementById("playPause").addEventListener("click", toggleSimulation);
}

// Create a new grid with random spins (+1 or -1)
function initGrid() {
  grid = [];
  for (let i = 0; i < N; i++) {
    let row = [];
    for (let j = 0; j < N; j++) {
      row.push(Math.random() < 0.5 ? 1 : -1);
    }
    grid.push(row);
  }
  stepCount = 0;
}

// Compute the overall magnetization (average spin)
function computeMagnetization() {
  let sum = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      sum += grid[i][j];
    }
  }
  return sum / (N * N);
}

// Draw the grid on the canvas with red for spin up and blue for spin down
function drawGrid() {
  let cellWidth = canvas.width / N;
  let cellHeight = canvas.height / N;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      ctx.fillStyle = grid[i][j] === 1 ? "red" : "blue";
      ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
    }
  }
}

// Perform one Monte Carlo sweep using the Metropolis algorithm
function simulationStep() {
  // Attempt N*N spin flips (one sweep)
  for (let n = 0; n < N * N; n++) {
    let i = Math.floor(Math.random() * N);
    let j = Math.floor(Math.random() * N);
    let spin = grid[i][j];

    // Periodic boundary conditions: get four nearest neighbors
    let up = grid[(i - 1 + N) % N][j];
    let down = grid[(i + 1) % N][j];
    let left = grid[i][(j - 1 + N) % N];
    let right = grid[i][(j + 1) % N];

    // Energy change if spin is flipped (with J=1, no external field)
    let sumNeighbors = up + down + left + right;
    let deltaE = 2 * spin * sumNeighbors;

    // Accept flip if energy decreases or probabilistically otherwise
    if (deltaE <= 0 || Math.random() < Math.exp(-deltaE / T)) {
      grid[i][j] = -spin;
    }
  }

  // Redraw the grid after the sweep
  drawGrid();

  // Update magnetization graph
  stepCount++;
  let magnetization = computeMagnetization();
  Plotly.extendTraces('plot', {
    x: [[stepCount]],
    y: [[magnetization]]
  }, [0]);
}

// Reset the simulation (pause if running, reinitialize grid and plot)
function resetSimulation() {
  if (isRunning) {
    toggleSimulation(); // pause if running
  }
  initGrid();
  drawGrid();
  stepCount = 0;
  // Reinitialize the Plotly graph
  Plotly.react('plot', [{
    x: [0],
    y: [computeMagnetization()],
    mode: 'lines',
    line: { shape: 'spline' }
  }], {
    title: 'Magnetization',
    xaxis: { title: 'Time (steps)' },
    yaxis: { title: 'Magnetization' }
  });
}

// Toggle between playing and pausing the simulation
function toggleSimulation() {
  isRunning = !isRunning;
  let button = document.getElementById("playPause");
  if (isRunning) {
    button.textContent = "⏸";
    simulationInterval = setInterval(simulationStep, 50);
  } else {
    button.textContent = "▶";
    clearInterval(simulationInterval);
  }
}

// Initialize the Plotly graph for magnetization
function initPlot() {
  Plotly.newPlot('plot', [{
    x: [0],
    y: [computeMagnetization()],
    mode: 'lines',
    line: { shape: 'spline' }
  }], {
    title: 'Magnetization',
    xaxis: { title: 'Time (steps)' },
    yaxis: { title: 'Magnetization' }
  });
}

window.onload = init;
