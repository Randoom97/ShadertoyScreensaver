import { useEffect, useState } from "react";
import "./GalleryTile.css";
import { getShader, Shader } from "../../tauri-commands";

export function GalleryTile({ shaderId }: { shaderId: string }) {
  let [shader, setShader] = useState<Shader | undefined>(undefined);

  useEffect(() => {
    getShader(shaderId).then((shader) => setShader(shader));
  }, [shaderId]);

  return (
    <div className="gallery-tile">
      <div className="gallery-tile-title">
        <h4 className="gallery-tile-title">{shader?.info.name}</h4>
        {"by: "}
        <a
          href={`https://www.shadertoy.com/user/${shader?.info.username}`}
          target="_blank"
        >
          {shader?.info.username}
        </a>
      </div>

      <canvas className="gallery-tile-canvas"></canvas>

      <div className="gallery-tile-controls">
        <button onClick={() => onViewOnShadertoy(shaderId)}>
          View on Shadertoy
        </button>
        <button>Install</button>
        <button>Preview</button>
      </div>
    </div>
  );
}

function onViewOnShadertoy(shaderId: string) {
  // TODO get this to open in a default browser instead of a new tauri window
  window.open(`https://shadertoy.com/view/${shaderId}`, "_blank");
}
