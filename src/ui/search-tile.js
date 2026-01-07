export const searchTileClassNames = {
  root: "search-tile",
  iconWrap: "search-icon-wrap",
  icon: "search-icon",
  form: "search-form",
  input: "search-input",
  submit: "search-submit",
  spinner: "spinner",
  hidden: "hidden",
  label: "substance-label",
  expanded: "expanded",
  active: "active",
};

export function createSearchTile({
  placeholder = "Search for substance",
  ariaLabel = "Search substance",
} = {}) {
  const root = document.createElement("div");
  root.className = `tile ${searchTileClassNames.root}`;
  root.setAttribute("aria-label", ariaLabel);

  const iconWrap = document.createElement("div");
  iconWrap.className = searchTileClassNames.iconWrap;
  iconWrap.setAttribute("role", "button");
  iconWrap.setAttribute("title", "Search");

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", searchTileClassNames.icon);
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "10");
  circle.setAttribute("cy", "10");
  circle.setAttribute("r", "7");
  circle.setAttribute("stroke", "#666");
  circle.setAttribute("stroke-width", "2");
  circle.setAttribute("fill", "none");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "16");
  line.setAttribute("y1", "16");
  line.setAttribute("x2", "21");
  line.setAttribute("y2", "21");
  line.setAttribute("stroke", "#666");
  line.setAttribute("stroke-width", "2");
  line.setAttribute("stroke-linecap", "round");

  icon.appendChild(circle);
  icon.appendChild(line);
  iconWrap.appendChild(icon);

  const form = document.createElement("form");
  form.className = `${searchTileClassNames.form} ${searchTileClassNames.hidden}`;

  const input = document.createElement("input");
  input.className = searchTileClassNames.input;
  input.type = "text";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.autocorrect = "off";
  input.autocapitalize = "off";
  input.spellcheck = false;

  const button = document.createElement("button");
  button.className = searchTileClassNames.submit;
  button.type = "submit";

  const spinner = document.createElement("span");
  spinner.className = `${searchTileClassNames.spinner} ${searchTileClassNames.hidden}`;

  button.appendChild(spinner);
  form.appendChild(input);
  form.appendChild(button);

  root.appendChild(iconWrap);
  root.appendChild(form);

  return {
    root,
    iconWrap,
    icon,
    form,
    input,
    button,
    spinner,
  };
}

export class SearchTileController {
  constructor({
    root,
    iconWrap,
    form,
    input,
    button,
    spinner,
    onSubmit,
  }) {
    this.root = root;
    this.iconWrap = iconWrap;
    this.form = form;
    this.input = input;
    this.button = button;
    this.spinner = spinner;
    this.onSubmit = onSubmit;
    this.spinnerTimeout = null;

    this.handleIconClick = this.handleIconClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);

    this.iconWrap.addEventListener("click", this.handleIconClick);
    this.form.addEventListener("submit", this.handleSubmit);
    document.addEventListener("keydown", this.handleKeydown);
  }

  destroy() {
    this.iconWrap.removeEventListener("click", this.handleIconClick);
    this.form.removeEventListener("submit", this.handleSubmit);
    document.removeEventListener("keydown", this.handleKeydown);
  }

  setExpanded(expanded) {
    this.root.classList.toggle(searchTileClassNames.expanded, expanded);
    this.iconWrap.classList.toggle(searchTileClassNames.hidden, expanded);
    this.form.classList.toggle(searchTileClassNames.hidden, !expanded);
    if (expanded) {
      setTimeout(() => this.input.focus(), 50);
    }
  }

  setLabel(labelText) {
    this.iconWrap.innerHTML = "";
    const label = document.createElement("span");
    label.className = searchTileClassNames.label;
    label.textContent = labelText;
    this.iconWrap.appendChild(label);
  }

  pulseActive(duration = 1200) {
    this.root.classList.add(searchTileClassNames.active);
    setTimeout(() => this.root.classList.remove(searchTileClassNames.active), duration);
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.spinnerTimeout = setTimeout(() => {
        this.spinner.classList.remove(searchTileClassNames.hidden);
      }, 1000);
      return;
    }

    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
      this.spinnerTimeout = null;
    }
    this.spinner.classList.add(searchTileClassNames.hidden);
  }

  async handleIconClick(event) {
    event.stopPropagation();
    this.setExpanded(true);
  }

  async handleSubmit(event) {
    event.preventDefault();
    const query = this.input.value.trim();
    if (!query) return;

    this.setLoading(true);

    try {
      await this.onSubmit?.(query, this);
    } finally {
      this.setLoading(false);
      this.setExpanded(false);
    }
  }

  handleKeydown(event) {
    if (event.key === "Escape" && !this.form.classList.contains(searchTileClassNames.hidden)) {
      this.setExpanded(false);
    }
  }
}
