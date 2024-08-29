import { ShaderToy } from "./shader-setup";

export function renderShader(gl: WebGL2RenderingContext, shader: ShaderToy) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(shader.image.program);

  // bind uniforms here
  const uniforms = shader.image.uniforms;
  gl.uniform3f(uniforms.iResolution, gl.canvas.width, gl.canvas.height, 0.0);
  gl.uniform1f(uniforms.iTime, 0.0);

  const vertexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(shader.image.attributes.pos, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.image.attributes.pos);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
