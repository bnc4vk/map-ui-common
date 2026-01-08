export function createDateRange({
  startLabel = "Start date",
  endLabel = "End date",
  start = "",
  end = "",
  min,
  max,
  onChange,
} = {}) {
  const container = document.createElement("div");
  container.className = "map-ui-date-range";

  const startField = document.createElement("label");
  startField.className = "map-ui-date-range__field";
  const startText = document.createElement("span");
  startText.className = "map-ui-date-range__label";
  startText.textContent = startLabel;
  const startInput = document.createElement("input");
  startInput.className = "map-ui-date-range__input";
  startInput.type = "date";
  startInput.value = start;
  if (min) {
    startInput.min = min;
  }
  if (max) {
    startInput.max = max;
  }
  startField.append(startText, startInput);

  const endField = document.createElement("label");
  endField.className = "map-ui-date-range__field";
  const endText = document.createElement("span");
  endText.className = "map-ui-date-range__label";
  endText.textContent = endLabel;
  const endInput = document.createElement("input");
  endInput.className = "map-ui-date-range__input";
  endInput.type = "date";
  endInput.value = end;
  if (min) {
    endInput.min = min;
  }
  if (max) {
    endInput.max = max;
  }
  endField.append(endText, endInput);

  container.append(startField, endField);

  function emitChange() {
    onChange?.({
      start: startInput.value,
      end: endInput.value,
    });
  }

  startInput.addEventListener("change", emitChange);
  endInput.addEventListener("change", emitChange);

  return {
    element: container,
    getValue: () => ({ start: startInput.value, end: endInput.value }),
    setValue: ({ start: nextStart, end: nextEnd }) => {
      if (nextStart !== undefined) {
        startInput.value = nextStart;
      }
      if (nextEnd !== undefined) {
        endInput.value = nextEnd;
      }
    },
  };
}
