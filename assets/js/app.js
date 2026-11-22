const { tafel, tafelNachMittelquadrat, tafelNachLoShu, blockFaktoren: blockFactors, randzahlen, einheiten } = einmaleinsDaten;
const blockSize = 3;
const numberArrangement = document.querySelector("#zahlenanordnung");
const arrangements = new Map([
  ["original", tafel],
  ["mittelquadrat", tafelNachMittelquadrat],
  ["lo-shu", tafelNachLoShu],
]);
const mirrorBody = document.querySelector("#mirror-table").createTBody();
const mirrorScroll = document.querySelector("#mirror-scroll");
const scrollHint = document.querySelector("#scroll-hint");
const equation = document.querySelector("#equation");
const mirrorNote = document.querySelector("#mirror-note");
const magicTable = document.querySelector("#magic-table");
const magicCaption = document.querySelector("#magic-caption");
const magicDiagonalDescending = document.querySelector("#magic-diagonal-descending");
const magicDiagonalAscending = document.querySelector("#magic-diagonal-ascending");
const magicScroll = document.querySelector("#magic-scroll");
const magicScrollHint = document.querySelector("#magic-scroll-hint");

const arrowSteps = new Map([
  ["ArrowUp", [-1, 0]],
  ["ArrowDown", [1, 0]],
  ["ArrowLeft", [0, -1]],
  ["ArrowRight", [0, 1]],
]);

const markedFactors = new Set();
let cells;
// Der zuletzt gezeigte Block bleibt als Vorschau sichtbar, wenn die Auswahl endet.
let currentCell;
let selectedCell;
let swappedCell;
let tabbableCell;

function addMarginCell(row, value, mint = false, colspan = 1) {
  const cell = row.insertCell();
  cell.className = mint ? "margin-cell margin-mint" : "margin-cell";
  cell.colSpan = colspan;
  if (value) {
    cell.textContent = value;
    cell.setAttribute("aria-label", `Randzahl ${value}`);
  }
}

function addMarginBand(value) {
  const row = mirrorBody.insertRow();
  row.className = "margin-band";
  addMarginCell(row, null, false, 5);
  addMarginCell(row, value);
  addMarginCell(row, null, false, 5);
}

function renderNumber(row, value, rowIndex, columnIndex, squares) {
  const blockRow = Math.floor(rowIndex / blockSize);
  const blockColumn = Math.floor(columnIndex / blockSize);
  const square = squares[blockRow][blockColumn];
  const td = row.insertCell();
  const partner = value / square.factor;
  const isFactor = partner === 1;
  const isMiddleSquare = blockRow === 1 && blockColumn === 1;
  const isCornerSquare = blockRow !== 1 && blockColumn !== 1;
  const isRose = isMiddleSquare ? !isFactor : isFactor;
  const tone = isRose ? "tone-rose" : isCornerSquare ? "tone-mint" : "tone-dark";

  td.classList.add("mirror-cell", tone);
  td.classList.toggle("block-top", rowIndex % blockSize === 0);
  td.classList.toggle("block-left", columnIndex % blockSize === 0);
  td.classList.toggle("block-bottom", rowIndex === squares.length * blockSize - 1);
  td.classList.toggle("block-right", columnIndex === squares[blockRow].length * blockSize - 1);

  const button = document.createElement("button");
  const cell = { button, square, partner, value };
  button.type = "button";
  button.className = "btn number-button w-100 p-0 fw-bold rounded-2";
  button.tabIndex = -1;
  button.textContent = value;
  button.setAttribute("aria-label", `${square.factor} mal ${partner} ist ${value}`);
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => selectNumber(cell));
  button.addEventListener("focus", () => setTabStop(cell));
  button.addEventListener("keydown", (event) => moveFocus(event, rowIndex, columnIndex));
  td.append(button);
  return cell;
}

function setTabStop(cell) {
  if (tabbableCell) tabbableCell.button.tabIndex = -1;
  tabbableCell = cell;
  cell.button.tabIndex = 0;
}

function moveFocus(event, row, column) {
  const step = arrowSteps.get(event.key);
  if (!step) return;

  event.preventDefault();
  cells[row + step[0]]?.[column + step[1]]?.button.focus();
}

function findNumber(factor, partner) {
  return cells.flat().find((cell) => cell.square.factor === factor && cell.partner === partner);
}

function markFactor(factor, role) {
  // Im Block steht der Faktor bei Faktor × 1, im Mittelquadrat bei 1 × Faktor.
  const buttons = new Set([findNumber(factor, 1).button, findNumber(1, factor).button]);
  for (const button of buttons) {
    markedFactors.add(button);
    button.classList.add("is-factor", role);
    button.setAttribute("aria-describedby", `${role}-hinweis`);
  }
}

function formatFactors(first, second, blockFactor) {
  const [left, right] = [first, second].map((value) => {
    const token = document.createElement("span");
    token.className = value === blockFactor ? "factor-token factor-block" : "factor-token factor-partner";
    token.textContent = value;
    return token;
  });
  return [left, " × ", right];
}

function clearNumberHighlights() {
  selectedCell?.button.classList.remove("is-selected");
  selectedCell?.button.setAttribute("aria-pressed", "false");
  swappedCell?.button.classList.remove("is-match");
  for (const button of markedFactors) {
    button.classList.remove("is-factor", "factor-block", "factor-partner");
    button.removeAttribute("aria-describedby");
  }
  markedFactors.clear();
}

function showCurrentCell(cell) {
  if (currentCell?.square !== cell.square) renderMagicSquare(cell.square);
  currentCell = cell;
  setTabStop(cell);
}

function selectNumber(cell) {
  clearNumberHighlights();
  const { square, partner, value } = cell;
  const { factor } = square;
  selectedCell = cell;
  swappedCell = findNumber(partner, factor);

  cell.button.classList.add("is-selected");
  cell.button.setAttribute("aria-pressed", "true");
  if (swappedCell !== cell) swappedCell.button.classList.add("is-match");
  markFactor(factor, "factor-block");
  if (factor !== partner) markFactor(partner, "factor-partner");

  equation.replaceChildren(...formatFactors(factor, partner, factor), ` = ${value}`);
  if (swappedCell === cell) {
    mirrorNote.textContent = "Beide Faktoren sind gleich.";
  } else {
    mirrorNote.replaceChildren("Die Tauschaufgabe ", ...formatFactors(partner, factor, factor), ` ergibt auch ${value}.`);
  }
  showCurrentCell(cell);
  document.dispatchEvent(new CustomEvent("einmaleins:selection-change", { detail: { factor } }));
}

function resetSelections() {
  if (selectedCell) {
    clearNumberHighlights();
    selectedCell = undefined;
    swappedCell = undefined;
    equation.textContent = "Wähle ein Feld.";
    mirrorNote.textContent = "";
  }
  // Die Lernhilfe setzt Dividend und Teiler gemeinsam zurück.
  document.dispatchEvent(new Event("einmaleins:selection-clear"));
}

function sumValues(numbers) {
  return numbers.reduce((total, value) => total + value, 0);
}

function addSumCell(row, sum, label) {
  const cell = row.insertCell();
  cell.className = "sum-cell bg-info-subtle text-info-emphasis text-nowrap";
  cell.textContent = `= ${sum}`;
  cell.setAttribute("aria-label", `${label} ergibt ${sum}`);
}

function renderMagicSquare({ factor, values }) {
  magicCaption.textContent = `Die ${factor}er-Reihe`;
  const body = magicTable.tBodies[0] ?? magicTable.createTBody();
  const foot = magicTable.tFoot ?? magicTable.createTFoot();
  body.replaceChildren();
  foot.replaceChildren();

  values.forEach((numbers, rowIndex) => {
    const row = body.insertRow();
    for (const value of numbers) row.insertCell().textContent = value;
    addSumCell(row, sumValues(numbers), `Zeile ${rowIndex + 1}`);
  });

  const columnTotals = foot.insertRow();
  values[0].forEach((_, columnIndex) => {
    const numbers = values.map((row) => row[columnIndex]);
    addSumCell(columnTotals, sumValues(numbers), `Spalte ${columnIndex + 1}`);
  });
  columnTotals.insertCell().className = "border-0 bg-transparent";

  magicDiagonalDescending.textContent = sumValues(values.map((row, index) => row[index]));
  magicDiagonalAscending.textContent = sumValues(values.map((row, index) => row[values.length - 1 - index]));
  updateMagicScrollAffordance();
}

function renderStrip(tableId, values, fillCell) {
  const table = document.getElementById(tableId);
  const body = table.tBodies[0] ?? table.createTBody();
  body.replaceChildren();
  for (const row of values) {
    const tr = body.insertRow();
    for (const value of row) fillCell(tr.insertCell(), value);
  }
}

function renderMirror(numbers) {
  const squares = blockFactors.map((factors, blockRow) =>
    factors.map((factor, blockColumn) => {
      const firstRow = blockRow * blockSize;
      const firstColumn = blockColumn * blockSize;
      const values = numbers.slice(firstRow, firstRow + blockSize)
        .map((row) => row.slice(firstColumn, firstColumn + blockSize));
      return { values, factor };
    }),
  );

  mirrorBody.replaceChildren();
  addMarginBand(randzahlen.oben);
  cells = numbers.map((values, rowIndex) => {
    const row = mirrorBody.insertRow();
    const blockRow = Math.floor(rowIndex / blockSize);
    const hasRandzahl = rowIndex % blockSize === 1;
    addMarginCell(row, hasRandzahl ? randzahlen.links[blockRow] : null, blockRow !== 1);
    const rowCells = values.map((value, columnIndex) => renderNumber(row, value, rowIndex, columnIndex, squares));
    addMarginCell(row, hasRandzahl ? randzahlen.rechts[blockRow] : null, blockRow !== 1);
    return rowCells;
  });
  addMarginBand(randzahlen.unten);
}

function loadArrangement() {
  const previous = currentCell;
  renderMirror(arrangements.get(numberArrangement.value));
  // Dasselbe Produkt kann mehrmals vorkommen. Das Faktorenpaar identifiziert die Aufgabe.
  const cell = previous ? findNumber(previous.square.factor, previous.partner) : findNumber(4, 6);
  if (selectedCell) {
    selectNumber(cell);
  } else {
    showCurrentCell(cell);
  }
  updateScrollAffordance();
}

renderStrip("units-table", [einheiten], (cell, [shortName, longName]) => {
  const abbreviation = document.createElement("abbr");
  abbreviation.title = longName;
  abbreviation.textContent = shortName;
  cell.classList.add("bg-danger-subtle", "text-danger-emphasis");
  cell.append(abbreviation);
});

const scrollableStrips = document.querySelectorAll('#spiegel .table-responsive[role="region"]');
const stripScrollHint = document.querySelector("#strip-scroll-hint");

function setScrollableTabStop(region) {
  const overflows = region.scrollWidth > region.clientWidth;
  region.tabIndex = overflows ? 0 : -1;
  return overflows;
}

function updateMagicScrollAffordance() {
  magicScrollHint.hidden = !setScrollableTabStop(magicScroll);
}

function updateScrollAffordance() {
  scrollHint.hidden = mirrorScroll.scrollWidth <= mirrorScroll.clientWidth;
  let stripOverflows = false;
  for (const strip of scrollableStrips) {
    if (setScrollableTabStop(strip)) stripOverflows = true;
  }
  stripScrollHint.hidden = !stripOverflows;
}

loadArrangement();
numberArrangement.addEventListener("change", loadArrangement);
document.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("#mirror-table, #division-table, #lernhilfen, #lernhilfen-toggle, .offcanvas-backdrop, .help-trigger, .tooltip")) return;

  resetSelections();
});
window.addEventListener("resize", updateScrollAffordance);
// Die Breite des Zauberquadrats ändert sich auch beim Öffnen der Lernhilfe.
new ResizeObserver(updateMagicScrollAffordance).observe(magicScroll);

const Tooltip = window.bootstrap?.Tooltip;
if (Tooltip) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const dismissHelp = new Map();
  for (const button of document.querySelectorAll('[data-bs-toggle="tooltip"]')) {
    const tooltip = new Tooltip(button, {
      trigger: canHover ? "hover focus" : "click",
      delay: { hide: canHover ? 160 : 0, show: 0 },
    });
    let hoveringTooltip = false;
    const dismiss = () => {
      hoveringTooltip = false;
      tooltip.hide();
    };
    dismissHelp.set(button, dismiss);

    // Die kurze Verzögerung gibt Zeit, vom Hilfesymbol auf den Hilfetext zu wechseln.
    button.addEventListener("inserted.bs.tooltip", () => {
      const tip = document.getElementById(button.getAttribute("aria-describedby"));
      tip.addEventListener("pointerenter", () => { hoveringTooltip = canHover; });
      tip.addEventListener("pointerleave", () => {
        hoveringTooltip = false;
        if (canHover && !button.matches(":hover, :focus")) tooltip.hide();
      });
    });
    button.addEventListener("hide.bs.tooltip", (event) => {
      if (hoveringTooltip) event.preventDefault();
    });
    button.closest("#lernhilfen")?.addEventListener("hide.bs.offcanvas", dismiss);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const [button, dismiss] of dismissHelp) {
      if (!button.hasAttribute("aria-describedby")) continue;
      dismiss();
      // Bei geöffneter mobiler Lernhilfe schließt Escape zuerst den Tooltip.
      event.stopPropagation();
    }
  }, { capture: true });

  if (!canHover) {
    document.addEventListener("click", (event) => {
      for (const [button, dismiss] of dismissHelp) {
        if (!button.contains(event.target)) dismiss();
      }
    });
  }
}
