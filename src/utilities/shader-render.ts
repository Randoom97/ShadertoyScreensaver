import { BufferPair, GLShader, ShaderToy } from "./shader-setup";

export function renderShaderToy(
  gl: WebGL2RenderingContext,
  shaderToy: ShaderToy
) {
  shaderToy.bufferShaders.forEach((bufferShader) => {
    const bufferPair = shaderToy.buffers.get(
      bufferShader.metadata.outputs[0].id
    )!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, bufferPair.frameBuffer);
    renderShader(gl, bufferShader, shaderToy.buffers);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  });

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  renderShader(gl, shaderToy.image, shaderToy.buffers);
}

export function renderShader(
  gl: WebGL2RenderingContext,
  shader: GLShader,
  buffers: Map<number, BufferPair>
) {
  const inputs = shader.metadata.inputs
    .filter((input) => input.ctype === "buffer" || input.ctype === "texture")
    .map((input) => {
      return {
        channel: input.channel,
        texture: buffers.get(input.id)!.texture,
      };
    });
  render(gl, shader, inputs);
}

function render(
  gl: WebGL2RenderingContext,
  shader: GLShader,
  inputs: { channel: number; texture: WebGLTexture }[] = []
) {
  gl.useProgram(shader.program);

  // bind uniforms here
  const uniforms = shader.uniforms;
  gl.uniform3f(uniforms.iResolution, gl.canvas.width, gl.canvas.height, 0.0);
  gl.uniform1f(uniforms.iTime, 0.0);
  gl.uniform1f(uniforms.iFrameRate, 60.0);

  inputs.forEach((input) => {
    gl.uniform1i(shader.uniforms.iChannels[input.channel]!, input.channel);
    gl.activeTexture(gl.TEXTURE0 + input.channel);
    gl.bindTexture(gl.TEXTURE_2D, input.texture);
  });

  const vertexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(shader.attributes.pos, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.attributes.pos);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
