import "./ShaderCanvas.css";
import { Shader } from "../../utilities/tauri-commands";
import { createRef, useEffect, useRef } from "react";
import { initShader } from "../../utilities/shader/pipeline";
import { Renderer } from "../../utilities/shader/renderer";

export function ShaderCanvas({
  shader,
  aspectRatio = undefined,
}: {
  shader: Shader;
  aspectRatio: number | undefined;
}) {
  const glRef = useRef<WebGL2RenderingContext>();
  const rendererRef = useRef<Renderer>();
  const canvasRef = createRef<HTMLCanvasElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    glRef.current = canvas?.getContext("webgl2") ?? undefined;

    if (glRef.current) {
      const gl = glRef.current;
      // enables RGBA32F textures. Needed for negative alpha in some shaders
      gl.getExtension("OES_texture_float_linear");
      gl.getExtension("EXT_color_buffer_float");
      resize(gl, aspectRatio);
      initShader(gl, shader).then((shaderToy) => {
        if (!shaderToy) {
          return;
        }
        const renderer = new Renderer(gl, shaderToy);
        rendererRef.current = renderer;
        // give it just a tiny bit of time to render on load
        renderer.renderLoop();
        setTimeout(() => renderer.suspend(), 100);
      });
    }

    const onResize = () => {
      const gl = glRef.current;
      const renderer = rendererRef.current;
      if (!gl || !renderer) {
        return;
      }
      resize(gl, aspectRatio);
      // TODO: resize render buffers to match viewport
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

function resize(gl: WebGL2RenderingContext, aspectRatio: number | undefined) {
  if (gl.canvas instanceof HTMLCanvasElement) {
    gl.canvas.width = gl.canvas.clientWidth;
    if (aspectRatio) {
      gl.canvas.height = gl.canvas.clientWidth / aspectRatio;
    } else {
      gl.canvas.height = gl.canvas.clientHeight;
    }
  }
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}
