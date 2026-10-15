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

    expect(screen.queryByRole("link", { name: "donate to ASPCA today" })).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "ab" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchSearchResultsFromAPI).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Type at least 3 characters"
    );
  });

  it("shows matching cat photos after the debounce", async () => {
    fetchSearchResultsFromAPI.mockResolvedValue([
      {
        breed: "Abyssinian",
        origin: "Egypt",
        life_span: "14 - 17",
        temperament: "Active, Energetic, Independent, Intelligent, Gentle",
        description: "The Abyssinian is easy to care for and a joy to have in your home.",
        imageUrl: "https://cdn2.thecatapi.com/images/abys.jpg",
        imageWidth: 560,
        imageHeight: 373,
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
    expect(screen.getByRole("status")).toHaveTextContent("1 cat photo found");
    expect(screen.getByRole("img", { name: "donate to ASPCA today" })).toHaveAttribute(
      "src",
      "/aspca-logo.png"
    );
    expect(screen.getByRole("img", { name: "donate to ASPCA today" })).toHaveAttribute(
      "width",
      "200"
    );
    expect(screen.getByRole("link", { name: "donate to ASPCA today" })).toHaveAttribute(
      "href",
      "https://secure.aspca.org/donate/ft"
    );
    expect(screen.getByRole("link", { name: "donate to ASPCA today" })).toHaveClass(
      "footer-logo-fade-in"
    );
    expect(screen.getByRole("heading", { name: "Photos of Abyssinian" })).toBeVisible();
    expect(screen.getByText("The Abyssinian is easy to care for and a joy to have in your home.")).toBeVisible();
    expect(screen.getByRole("img", { name: "Abyssinian cat" })).toHaveAttribute(
      "src",
      "https://cdn2.thecatapi.com/images/abys.jpg"
    );
    expect(screen.getByRole("img", { name: "Abyssinian cat" })).toHaveAttribute(
      "loading",
      "lazy"
    );
    expect(screen.getByRole("img", { name: "Abyssinian cat" })).toHaveAttribute(
      "decoding",
      "async"
    );
    expect(screen.getByRole("img", { name: "Abyssinian cat" })).toHaveAttribute(
      "width",
      "560"
    );
    expect(screen.getByRole("img", { name: "Abyssinian cat" })).toHaveAttribute(
      "height",
      "373"
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveClass(
      "grid",
      "sm:grid-cols-2",
      "lg:grid-cols-3"
    );
    expect(screen.getByRole("img", { name: "Abyssinian cat" }).closest("figure")).toHaveClass(
      "border-4",
      "border-white"
    );
    expect(screen.getByRole("region", { name: "Search results" })).toHaveTextContent(
      /Origin\s*Egypt\s*Life span\s*14 - 17 years/
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
    expect(screen.getByRole("heading", { name: "Photos of Bengal" })).toBeVisible();
  });
});
