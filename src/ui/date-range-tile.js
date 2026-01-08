export const dateRangeTileClassNames = {
  root: "date-range-tile",
  form: "date-range-form",
  input: "date-range-input",
  startInput: "date-range-start",
  endInput: "date-range-end",
  submit: "date-range-submit",
  spinner: "spinner",
  hidden: "hidden",
  active: "active",
};

export function createDateRangeTile({
  ariaLabel = "Filter by date range",
  startLabel = "Start date",
  endLabel = "End date",
  submitLabel = "Apply",
} = {}) {
  const root = document.createElement("div");
  root.className = `tile ${dateRangeTileClassNames.root}`;
  root.setAttribute("aria-label", ariaLabel);

  const form = document.createElement("form");
  form.className = dateRangeTileClassNames.form;

  const startInput = document.createElement("input");
  startInput.className = `${dateRangeTileClassNames.input} ${dateRangeTileClassNames.startInput}`;
  startInput.type = "date";
  startInput.setAttribute("aria-label", startLabel);

  const endInput = document.createElement("input");
  endInput.className = `${dateRangeTileClassNames.input} ${dateRangeTileClassNames.endInput}`;
  endInput.type = "date";
  endInput.setAttribute("aria-label", endLabel);

  const button = document.createElement("button");
  button.className = dateRangeTileClassNames.submit;
  button.type = "submit";
  button.textContent = submitLabel;

  const spinner = document.createElement("span");
  spinner.className = `${dateRangeTileClassNames.spinner} ${dateRangeTileClassNames.hidden}`;

  button.appendChild(spinner);
  form.appendChild(startInput);
  form.appendChild(endInput);
  form.appendChild(button);

  root.appendChild(form);

  return {
    root,
    form,
    startInput,
    endInput,
    button,
    spinner,
  };
}

export class DateRangeTileController {
  constructor({
    root,
    form,
    startInput,
    endInput,
    button,
    spinner,
    onSubmit,
  }) {
    this.root = root;
    this.form = form;
    this.startInput = startInput;
    this.endInput = endInput;
    this.button = button;
    this.spinner = spinner;
    this.onSubmit = onSubmit;
    this.spinnerTimeout = null;

    this.handleSubmit = this.handleSubmit.bind(this);

    this.form.addEventListener("submit", this.handleSubmit);
  }

  destroy() {
    this.form.removeEventListener("submit", this.handleSubmit);
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.spinnerTimeout = setTimeout(() => {
        this.spinner.classList.remove(dateRangeTileClassNames.hidden);
      }, 1000);
      return;
    }

    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
      this.spinnerTimeout = null;
    }
    this.spinner.classList.add(dateRangeTileClassNames.hidden);
  }

  pulseActive(duration = 1200) {
    this.root.classList.add(dateRangeTileClassNames.active);
    setTimeout(() => this.root.classList.remove(dateRangeTileClassNames.active), duration);
  }

  getRange() {
    return {
      startDate: this.startInput.value,
      endDate: this.endInput.value,
    };
  }

  setRange({ startDate = "", endDate = "" } = {}) {
    this.startInput.value = startDate;
    this.endInput.value = endDate;
  }

  async handleSubmit(event) {
    event.preventDefault();
    const { startDate, endDate } = this.getRange();

    if (!startDate && !endDate) {
      return;
    }

    this.setLoading(true);

    try {
      await this.onSubmit?.({ startDate, endDate }, this);
    } finally {
      this.setLoading(false);
    }
  }
}
