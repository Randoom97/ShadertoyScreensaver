import { SearchBar } from "./SearchBar";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("main", () => {
  it("should emit value change on enter", async () => {
    let currentValue = "";
    render(<SearchBar onValueChange={(v) => (currentValue = v)} />);
    const input = screen.getByText("", { selector: ".search-bar" });

    await userEvent.type(input, "cool shader");
    expect(currentValue).toEqual("");

    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(currentValue).toEqual("cool shader");
  });
});
