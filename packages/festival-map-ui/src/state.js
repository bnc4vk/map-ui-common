export function createFestivalState({ initialZoom, initialDateRange } = {}) {
  let state = {
    zoom: initialZoom ?? 0,
    dateRange: {
      start: initialDateRange?.start ?? "",
      end: initialDateRange?.end ?? "",
    },
    pending: false,
  };

  const listeners = new Set();

  function setState(partial) {
    state = { ...state, ...partial };
    listeners.forEach((listener) => listener(state));
  }

  return {
    getState: () => state,
    setZoom: (zoom) => setState({ zoom }),
    setDateRange: (dateRange) => setState({ dateRange }),
    setPending: (pending) => setState({ pending }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
