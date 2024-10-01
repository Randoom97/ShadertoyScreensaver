import "./App.css";
import { SortBy, getShaders } from "../utilities/tauri-commands";
import { SortBar } from "./sort-bar/SortBar";
import { PageSelector } from "./page-selector/PageSelector";
import { Gallery } from "./gallery/Gallery";
import { useEffect, useState } from "react";

export function App() {
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Popular);
  const [page, setPage] = useState<number>(0);
  const [shaderCount, setShaderCount] = useState<number>(0);
  const [shaderIds, setShaderIds] = useState<string[]>([]);

  const pageSize = 12;

  useEffect(() => {
    setShaderIds([]);
    // setShaderIds([
    //   "MsXGz4", // makes use of a cubemap
    //   "tlVGDt", // problem with white background
    //   "tsXBzS", // problem with white background
    //   "4dcGW2", // uses unbound input
    //   "XltGRX", // textures and buffers
    //   "MsKcRh", // buffer self dependency
    //   "XffBzl", // common code
    //   "XcfBRn", // simple
    //   "Xds3zN", // macros
    //   "MdX3Rr", // negative alpha value in buffer (RGBA32F internal format)
    //   "ssjyWc", // Received erroneous keyboard input if iChannel not bound
    // ]);
    getShaders({ sortBy, pageSize, pageNumber: page }).then((shaders) => {
      setShaderIds(shaders.Results);
      setShaderCount(shaders.Shaders);
    });
  }, [sortBy, page]);

  return (
    <div className="container">
      <div className="control-bar">
        <SortBar currentSortBy={sortBy} onSortByChange={setSortBy} />
        {shaderCount > 0 && (
          <PageSelector
            results={shaderCount}
            resultsPerPage={pageSize}
            currentPage={page}
            onPageChange={(page) => {
              setPage(page);
            }}
          />
        )}
      </div>
      <Gallery shaderIds={shaderIds} />
    </div>
  );
}
