import "@testing-library/jest-dom";
// Polyfill/Mock localStorage for tests
const store = {};
const localStorageMock = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
        store[key] = value.toString();
    },
    removeItem: (key) => {
        delete store[key];
    },
    clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
        return Object.keys(store).length;
    },
    key: (index) => Object.keys(store)[index] ?? null,
};
Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
});
