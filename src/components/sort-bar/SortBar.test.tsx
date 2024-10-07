import { SortBy } from "../../utilities/tauri-commands";
import { SortBar } from "./SortBar";
import { fireEvent, render, screen } from "@testing-library/react";

describe("main", () => {
  it("should have class selected on current sort by", () => {
    render(
      <SortBar currentSortBy={SortBy.Popular} onSortByChange={() => {}} />
    );
    const buttons = Object.values(SortBy).map((sortBy) =>
      screen.getByText(sortBy)
    );
    buttons.forEach((button) => {
      expect(button.classList.contains("selected")).toBe(
        button.textContent === SortBy.Popular
      );
    });
  });

  it("should emit the correct SortBy on click", () => {
    let currentSort = SortBy.Hot;
    render(
      <SortBar
        currentSortBy={currentSort}
        onSortByChange={(s) => (currentSort = s)}
      />
    );

    fireEvent.click(screen.getByText(SortBy.Popular));
    expect(currentSort).toBe(SortBy.Popular);

    fireEvent.click(screen.getByText(SortBy.Name));
    expect(currentSort).toBe(SortBy.Name);
  });
});
