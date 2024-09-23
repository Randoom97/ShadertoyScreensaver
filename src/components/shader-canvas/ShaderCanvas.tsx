import "./ShaderCanvas.css";
import { Shader } from "../../utilities/tauri-commands";
import { renderShaderToy } from "../../utilities/shader-render";
import { createRef, useEffect, useRef } from "react";
import { ShaderToy } from "../../utilities/shader/interfaces";
import { initShader } from "../../utilities/shader/pipeline";

export function ShaderCanvas({
  shader,
  aspectRatio = undefined,
}: {
  shader: Shader;
  aspectRatio: number | undefined;
}) {
  const glRef = useRef<WebGL2RenderingContext>();
  const shaderToyRef = useRef<ShaderToy>();
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
        shaderToyRef.current = shaderToy;
        renderShaderToy(gl, shaderToy);
      });
    }

    function onResize() {
      const gl = glRef.current;
      const shaderToy = shaderToyRef.current;
      if (!gl || !shaderToy) {
        return;
      }
      resize(gl, aspectRatio);
      // TODO: resize render buffers to match viewport
      renderShaderToy(gl, shaderToy);
    }
    window.addEventListener("resize", onResize);

    function animationFrame() {
      requestAnimationFrame(animationFrame);
      const gl = glRef.current;
      const shaderToy = shaderToyRef.current;
      if (!gl || !shaderToy) {
        return;
      }
      renderShaderToy(gl, shaderToy);
    }
    requestAnimationFrame(animationFrame);

    return () => {
      window.removeEventListener("resize", onResize);
      // TODO teardown gl context
    };
  }, []);

  return <canvas ref={canvasRef} className="shader-canvas"></canvas>;
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
