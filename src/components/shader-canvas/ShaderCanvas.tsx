import "./ShaderCanvas.css";
import { Shader } from "../../utilities/tauri-commands";
import { createRef, useEffect, useRef } from "react";
import { Renderer } from "../../utilities/shader/renderer";

export function ShaderCanvas({
  shader,
  aspectRatio = undefined,
}: {
  shader: Shader;
  aspectRatio: number | undefined;
}) {
  const rendererRef = useRef<Renderer>();
  const canvasRef = createRef<HTMLCanvasElement>();

  useEffect(() => {
    Renderer.createRenderer(canvasRef.current!, shader, aspectRatio).then(
      (renderer) => {
        rendererRef.current = renderer;

        // give it just a tiny bit of time to render on load
        renderer.renderLoop();
        setTimeout(() => renderer.suspend(), 100);
      }
    );

    const onResize = () => {
      const renderer = rendererRef.current;
      if (!renderer) {
        return;
      }
      renderer.resize(aspectRatio);
      renderer.renderOnce();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      // TODO teardown gl context
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="shader-canvas"
      onMouseEnter={() => rendererRef.current?.renderLoop()}
      onMouseLeave={() => rendererRef.current?.suspend()}
    ></canvas>
  );
}
