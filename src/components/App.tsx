import "./App.css";
import { SortBy, getShaders } from "../utilities/tauri-commands";
import { SortBar } from "./sort-bar/SortBar";
import { Gallery } from "./gallery/Gallery";
import { useEffect, useState } from "react";

export function App() {
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Popular);
  const [page, setPage] = useState<number>(0);
  const [shaderIds, setShaderIds] = useState<string[]>([]);

  useEffect(() => {
    setShaderIds([]);
    setShaderIds([
      "MsXGz4", // makes use of a cubemap
      "tlVGDt", // problem with white background
      "tsXBzS", // problem with white background
      "4dcGW2", // uses unbound input
      "XltGRX", // textures and buffers
      "MsKcRh", // buffer self dependency
      "XffBzl", // common code
      "XcfBRn", // simple
      "Xds3zN", // macros
      "MdX3Rr", // negative alpha value in buffer (RGBA32F internal format)
      "ssjyWc",
    ]);
    // setShaderIds(["ssjyWc"]);
    // getShaders({ sortBy, pageSize: 12, pageNumber: 0 }).then((shaders) =>
    //   setShaderIds(shaders.Results)
    // );
  }, [sortBy]);

  return (
    <div className="container">
      <SortBar currentSortBy={sortBy} onSortByChange={setSortBy} />
      <Gallery shaderIds={shaderIds} />
    </div>
  );
}
