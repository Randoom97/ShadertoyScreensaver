import "./App.css";
import { SortBy, getShader, getShaders } from "./tauri-commands";
import { SortBar } from "./sort-bar/SortBar";
import { Gallery } from "./gallery/Gallery";
import { useEffect, useState } from "react";

export function App() {
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Name);
  const [page, setPage] = useState<number>(0);
  const [shaderIds, setShaderIds] = useState<string[]>([]);

  useEffect(() => {
    setShaderIds([]);
    getShaders({ sortBy, pageSize: 12, pageNumber: 0 }).then((shaders) =>
      setShaderIds(shaders.Results)
    );
  }, [sortBy]);

  return (
    <div className="container">
      <SortBar currentSortBy={sortBy} onSortByChange={setSortBy} />
      <Gallery shaderIds={shaderIds} />
    </div>
  );
}
