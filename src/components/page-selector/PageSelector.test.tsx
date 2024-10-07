import { PageSelector } from "./PageSelector";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("main", () => {
  it("should have class selected on the current page", () => {
    const currentPage = 1;
    renderComponent({ currentPage, results: 3, resultsPerPage: 1 });

    const buttons = [1, 2, 3].map((i) => screen.getByText(i));
    buttons.forEach((button, i) => {
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button).toBeInTheDocument();
      expect(button?.classList.contains("selected")).toBe(i === currentPage);
    });
  });

  it("should output page change", () => {
    let pageOutput = -1;
    renderComponent({
      results: 3,
      resultsPerPage: 1,
      onPageChange: (p) => (pageOutput = p),
    });

    fireEvent.click(screen.getByText("1"));
    expect(pageOutput).toBe(0);

    fireEvent.click(screen.getByText("3"));
    expect(pageOutput).toBe(2);
  });

  it("should have a maximum page of results/resultsPerPage", () => {
    renderComponent({ results: 1001, resultsPerPage: 10 });
    expect(screen.queryByText("101")).toBeInTheDocument();
    expect(screen.queryByText("102")).toBeNull();
  });

  describe("elipsis", () => {
    it("should not show elipsis if range is small", () => {
      const { container } = renderComponent({ results: 5, currentPage: 2 });
      const selectorDiv = container.querySelector(".page-selector");
      expect(selectorDiv).toBeInTheDocument();

      expect(
        [...selectorDiv!.children].map((element) => element.textContent)
      ).toEqual(["Results (5): ", "1", "2", "3", "4", "5"]);
    });

    it("should show elipsis before last page button", () => {
      const { container } = renderComponent({ results: 5, currentPage: 0 });
      const selectorDiv = container.querySelector(".page-selector");
      expect(selectorDiv).toBeInTheDocument();

      expect(
        [...selectorDiv!.children].map((element) => element.textContent)
      ).toEqual(["Results (5): ", "1", "2", "3", "...", "5"]);
    });

    it("should show elipsis after first page button", () => {
      const { container } = renderComponent({ results: 5, currentPage: 4 });
      const selectorDiv = container.querySelector(".page-selector");
      expect(selectorDiv).toBeInTheDocument();

      expect(
        [...selectorDiv!.children].map((element) => element.textContent)
      ).toEqual(["Results (5): ", "1", "...", "3", "4", "5"]);
    });

    it("should show elipsis after first page button and before last page button", () => {
      const { container } = renderComponent({ results: 100, currentPage: 49 });
      const selectorDiv = container.querySelector(".page-selector");
      expect(selectorDiv).toBeInTheDocument();

      expect(
        [...selectorDiv!.children].map((element) => element.textContent)
      ).toEqual([
        "Results (100): ",
        "1",
        "...",
        "48",
        "49",
        "50",
        "51",
        "52",
        "...",
        "100",
      ]);
    });
  });

  const renderComponent = ({
    results = 5,
    resultsPerPage = 1,
    currentPage = 0,
    onPageChange = () => {},
  }: {
    results?: number;
    resultsPerPage?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
  }) => {
    return render(
      <PageSelector
        results={results}
        resultsPerPage={resultsPerPage}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    );
  };
});
