import "./App.css";
import { SortBy, getShader, getShaders } from "./tauri-commands";
import { SortBar } from "./sort-bar/SortBar";
import { useState } from "react";

export function App() {
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Name);

  async function greet() {
    const shaders = await getShaders();
    const shader = await getShader(shaders.Results[0]);
    console.log(shader);
  }

  return (
    <div className="container">
      <SortBar currentSortBy={sortBy} onSortByChange={setSortBy} />
    </div>
  );
}
