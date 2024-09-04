import { GalleryTile } from "./gallery-tile/GalleryTile";
import "./Gallery.css";

export function Gallery({ shaderIds }: { shaderIds: string[] }) {
  return (
    <div className="gallery">
      {shaderIds.map((id) => (
        <GalleryTile key={id} shaderId={id} />
      ))}
    </div>
  );
}
