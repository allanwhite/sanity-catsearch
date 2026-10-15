import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatSearch } from "./CatSearch";

const fetchSearchResultsFromAPI = vi.hoisted(() => vi.fn());

vi.mock("./searchApiClient", () => ({ fetchSearchResultsFromAPI }));

describe("CatSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchSearchResultsFromAPI.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not search before three characters", async () => {
    render(<CatSearch />);
    const input = screen.getByLabelText("Cat breed");

    fireEvent.change(input, { target: { value: "ab" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchSearchResultsFromAPI).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Type at least 3 characters"
    );
  });

  it("shows matching breeds after the debounce", async () => {
    fetchSearchResultsFromAPI.mockResolvedValue([
      {
        breed: "Abyssinian",
        country: "Ethiopia",
        "body type": "Oriental",
        coat: "",
        imageUrl: "https://cdn2.thecatapi.com/images/abys.jpg",
      },
    ]);
    render(<CatSearch />);

    fireEvent.change(screen.getByLabelText("Cat breed"), {
      target: { value: "aby" },
    });

    expect(screen.getByRole("status")).toHaveTextContent("Loading cat breeds");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchSearchResultsFromAPI).toHaveBeenCalledWith(
      "aby",
      expect.any(AbortSignal)
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 cat breed found");
    expect(screen.getByRole("list")).toHaveTextContent("Abyssinian");
    expect(screen.getByRole("img", { name: "Abyssinian cat" })).toHaveAttribute(
      "src",
      "https://cdn2.thecatapi.com/images/abys.jpg"
    );
    expect(screen.getByRole("table", { name: "Abyssinian details" })).toHaveTextContent(
      /Country\s*Ethiopia\s*Body Type\s*Oriental\s*Coat\s*—/
    );
  });

  it("uses only the final rapid query", async () => {
    fetchSearchResultsFromAPI.mockResolvedValue([{ breed: "Bengal" }]);
    render(<CatSearch />);
    const input = screen.getByLabelText("Cat breed");

    fireEvent.change(input, { target: { value: "aby" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fireEvent.change(input, { target: { value: "ben" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchSearchResultsFromAPI).toHaveBeenCalledTimes(1);
    expect(fetchSearchResultsFromAPI).toHaveBeenCalledWith(
      "ben",
      expect.any(AbortSignal)
    );
  });

  it("shows an error and retries the current query", async () => {
    fetchSearchResultsFromAPI
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce([{ breed: "Bengal" }]);
    render(<CatSearch />);

    fireEvent.change(screen.getByLabelText("Cat breed"), {
      target: { value: "ben" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByRole("status")).toHaveTextContent("could not search");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchSearchResultsFromAPI).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("list")).toHaveTextContent("Bengal");
  });
});
