import "./ShaderCanvas.css";
import { Shader } from "../../utilities/tauri-commands";
import { initShader } from "../../utilities/shader-setup";
import { renderShaderToy } from "../../utilities/shader-render";
import { createRef, useLayoutEffect, useState } from "react";

export function ShaderCanvas({ shader }: { shader: Shader }) {
  const [gl, setGL] = useState<WebGL2RenderingContext | undefined>();
  const canvasRef = createRef<HTMLCanvasElement>();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    setGL(canvas?.getContext("webgl2") ?? undefined);

    if (gl) {
      setup(gl, shader);
    }
  });

  return <canvas ref={canvasRef} className="shader-canvas"></canvas>;
}

async function setup(gl: WebGL2RenderingContext, shader: Shader) {
  const shaderToy = await initShader(gl, shader);
  if (!shaderToy) {
    return;
  }
  renderShaderToy(gl, shaderToy);
}
