import "./SearchBar.css";

export function SearchBar({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) {
  return (
    <input
      className="search-bar"
      type="text"
      placeholder="Search..."
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onValueChange(event.currentTarget.value);
        }
      }}
    ></input>
  );
}
