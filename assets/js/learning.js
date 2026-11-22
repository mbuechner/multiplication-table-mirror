(() => {
  const { teilenMitRest, dunkleTeilungszahlen } = einmaleinsDaten;
  const explanation = document.getElementById("teilen-erklaerung");
  const drawer = document.getElementById("lernhilfen");
  const drawerToggle = document.getElementById("lernhilfen-toggle");
  const result = document.getElementById("division-result");
  const proof = document.getElementById("division-proof");
  const dividendButtons = [];
  let activeDividend;
  let divisor = selectedCell?.square.factor;
  let tabbable;

  function divisorToken() {
    const token = document.createElement("span");
    token.className = "factor-token factor-block";
    token.textContent = divisor;
    return token;
  }

  function renderDivision() {
    proof.textContent = "";
    if (!activeDividend) {
      result.textContent = divisor === undefined
        ? "Wähle eine Zahl aus der Leiste."
        : `Teiler ${divisor}. Wähle eine Zahl aus der Leiste.`;
      return;
    }

    const { value } = activeDividend;
    if (divisor === undefined) {
      result.textContent = `Gewählte Zahl ${value}. Wähle ein Feld in der Maltafel.`;
      return;
    }

    // Dividend und Teiler sind positiv. Abrunden liefert die Zahl voller Gruppen.
    const quotient = Math.floor(value / divisor);
    const remainder = value % divisor;
    result.replaceChildren(`${value} : `, divisorToken(), ` = ${quotient} Rest ${remainder}`);
    proof.replaceChildren(`${value} = ${quotient} × `, divisorToken(), ` + ${remainder}`);
  }

  function setTabStop(button) {
    if (tabbable) tabbable.tabIndex = -1;
    tabbable = button;
    button.tabIndex = 0;
  }

  function clearDividend() {
    activeDividend?.button.classList.remove("is-selected");
    activeDividend?.button.setAttribute("aria-pressed", "false");
    activeDividend = undefined;
  }

  function selectDividend(button, value) {
    clearDividend();
    activeDividend = { button, value };
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
    setTabStop(button);

    explanation.open = true;
    const Offcanvas = window.bootstrap?.Offcanvas;
    if (Offcanvas && drawerToggle.getClientRects().length && !drawer.matches(".show, .showing")) {
      // Auf dem Handy übernimmt die Lernhilfe den Fokus und gibt ihn an die gewählte Zahl zurück.
      drawer.addEventListener("hidden.bs.offcanvas", () => button.focus({ preventScroll: true }), { once: true });
      Offcanvas.getOrCreateInstance(drawer).show(button);
    }
    renderDivision();
  }

  renderStrip("division-table", teilenMitRest, (cell, value) => {
    cell.classList.add("p-0");
    if (!dunkleTeilungszahlen.includes(value)) {
      cell.classList.add("bg-primary-subtle", "text-primary-emphasis");
    }

    const row = cell.parentElement.sectionRowIndex;
    const column = cell.cellIndex;
    const button = document.createElement("button");
    button.className = "btn number-button division-number w-100 p-0 fw-semibold rounded-2";
    button.type = "button";
    button.textContent = value;
    button.tabIndex = -1;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectDividend(button, value));
    button.addEventListener("focus", () => setTabStop(button));
    button.addEventListener("keydown", (event) => {
      const step = arrowSteps.get(event.key);
      if (!step) return;

      event.preventDefault();
      dividendButtons[row + step[0]]?.[column + step[1]]?.focus();
    });
    (dividendButtons[row] ??= []).push(button);
    cell.append(button);
  });

  setTabStop(dividendButtons[0][0]);
  renderDivision();
  updateScrollAffordance();

  document.addEventListener("einmaleins:selection-change", ({ detail: { factor } }) => {
    if (factor === divisor) return;

    divisor = factor;
    renderDivision();
  });
  document.addEventListener("einmaleins:selection-clear", () => {
    if (!activeDividend && divisor === undefined) return;

    clearDividend();
    divisor = undefined;
    renderDivision();
  });
})();
