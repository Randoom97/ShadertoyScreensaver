import "./ShaderCanvas.css";
import { Shader } from "../tauri-commands";
import { initShader } from "../shader-setup";
import { renderShader } from "../shader-render";
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

function setup(gl: WebGL2RenderingContext, shader: Shader) {
  const shaderToy = initShader(gl, shader);
  if (!shaderToy) {
    return;
  }
  renderShader(gl, shaderToy);
}
