import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ParentControls from "@/components/parents/ParentControls";

// Supabase mock — component calls supabase on mount; stub it out so tests stay unit-level
vi.mock("@/lib/supabaseClient", () => ({
  default: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  },
}));

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const MOCK_PROPS = {
  childId:          "child-test-123",
  parentId:         "parent-test-456",
  onLanguageChange: vi.fn(),
};

describe("ParentControls", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("renders Controls heading", () => {
    render(<ParentControls {...MOCK_PROPS} childName="Emma" childLanguage="en" />);
    expect(screen.getByText("Controls")).toBeInTheDocument();
  });

  it("shows default daily goal of 2", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Emma" childLanguage="en" />);
    await waitFor(() => expect(screen.getByText("2 missions per day")).toBeInTheDocument());
  });

  it("increments daily goal on + click", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Emma" childLanguage="en" />);
    await waitFor(() => screen.getByText("2 missions per day"));
    fireEvent.click(screen.getAllByText("+")[0]);
    expect(screen.getByText("3 missions per day")).toBeInTheDocument();
  });

  it("decrements daily goal on − click", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Emma" childLanguage="en" />);
    await waitFor(() => screen.getByText("2 missions per day"));
    fireEvent.click(screen.getAllByText("−")[0]);
    expect(screen.getByText("1 mission per day")).toBeInTheDocument();
  });

  it("does not go below 1 mission per day", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Emma" childLanguage="en" />);
    await waitFor(() => screen.getByText("2 missions per day"));
    const dec = screen.getAllByText("−")[0];
    fireEvent.click(dec);
    fireEvent.click(dec);
    expect(screen.getByText("1 mission per day")).toBeInTheDocument();
  });

  it("saves prefs to localStorage on change", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Emma" childLanguage="en" />);
    await waitFor(() => screen.getByText("2 missions per day"));
    fireEvent.click(screen.getAllByText("+")[0]);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("shows English for language 'en'", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Emma" childLanguage="en" />);
    await waitFor(() => expect(screen.getByText(/English/)).toBeInTheDocument());
  });

  it("shows Français for language 'fr'", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Amina" childLanguage="fr" />);
    await waitFor(() => expect(screen.getByText(/Français/)).toBeInTheDocument());
  });

  it("shows Kinyarwanda for language 'rw'", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Keza" childLanguage="rw" />);
    await waitFor(() => expect(screen.getByText(/Kinyarwanda/)).toBeInTheDocument());
  });

  it("shows child name in language row description", async () => {
    render(<ParentControls {...MOCK_PROPS} childName="Nia" childLanguage="en" />);
    // Multiple elements contain "Nia" (language row + sharing row)
    await waitFor(() => expect(screen.getAllByText(/Nia/).length).toBeGreaterThan(0));
  });
});
