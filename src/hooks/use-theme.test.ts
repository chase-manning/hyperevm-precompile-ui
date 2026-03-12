import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./use-theme";
import { STORAGE_KEYS } from "@/lib/local-storage";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to 'light' when localStorage is empty", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("reads initial theme from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("falls back to 'light' for invalid stored value", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "blue");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("toggles from light to dark", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("dark");
  });

  it("toggles from dark back to light", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "dark");
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("light");
  });

  it("adds 'dark' class to document.documentElement when dark", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes 'dark' class when toggled back to light", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "dark");
    const { result } = renderHook(() => useTheme());

    // Initially dark
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme to localStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark");
  });
});
