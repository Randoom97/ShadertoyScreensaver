import "./SortBar.css";
import { SortBy } from "../tauri-commands";

export function SortBar({
  currentSortBy,
  onSortByChange,
}: {
  currentSortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
}) {
  return (
    <div className="sort-bar">
      <span className="sort-bar-text">Sort: </span>
      {Object.values(SortBy).map((sortBy) => {
        const classNames = ["sort-bar-button"];
        if (currentSortBy === sortBy) {
          classNames.push("selected");
        }

        return (
          <button
            type="submit"
            className={classNames.join(" ")}
            onClick={() => onSortByChange(sortBy)}
          >
            {sortBy}
          </button>
        );
      })}
    </div>
  );
}
