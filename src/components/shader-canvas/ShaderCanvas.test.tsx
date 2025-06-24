import { ShaderCanvas } from "./ShaderCanvas";
import { fireEvent, render } from "@testing-library/react";
import { basicShader } from "../../utilities/shader/shader.test-utils";
import { Renderer } from "../../utilities/shader/renderer";
import { vi } from "vitest";

describe("main", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should trigger the renderer on resize", async () => {
    const renderer = await withRendererInstance(() => {
      render(<ShaderCanvas shader={basicShader} />);
    });

    const resizeSpy = vi.spyOn(renderer, "resize");
    expect(resizeSpy.mock.calls.length).toBe(0);

    window.dispatchEvent(new Event("resize"));

    expect(resizeSpy.mock.calls.length).toBe(1);
  });

  it("should trigger render loop on mouse enter", async () => {
    let canvas: Element | null = null;
    const renderer = await withRendererInstance(() => {
      const { container } = render(<ShaderCanvas shader={basicShader} />);
      canvas = container.querySelector(".shader-canvas");
    });
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    const renderLoopSpy = vi.spyOn(renderer, "renderLoop");
    expect(renderLoopSpy.mock.calls.length).toBe(0);

    fireEvent.mouseEnter(canvas!);

    expect(renderLoopSpy.mock.calls.length).toBe(1);
  });

  it("should trigger renderer suspend  on mouse exit", async () => {
    let canvas: Element | null = null;
    const renderer = await withRendererInstance(() => {
      const { container } = render(<ShaderCanvas shader={basicShader} />);
      canvas = container.querySelector(".shader-canvas");
    });
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    console.log(renderer);
    renderer.suspend();
    const suspendSpy = vi.spyOn(renderer, "suspend");
    expect(suspendSpy.mock.calls.length).toBe(0);

    fireEvent.mouseLeave(canvas!);

    expect(suspendSpy.mock.calls.length).toBe(1);
  });

  /**
   * Spys on Renderer.createRenderer so an instance can be returned when the ShaderCanvas is created.
   * Guarantees that ShaderCanvas' rendererRef is set before returning.
   * @param renderCall
   * @returns
   */
  const withRendererInstance = async (
    renderCall: () => void
  ): Promise<Renderer> => {
    let createRendererSpy = vi.spyOn(Renderer, "createRenderer");

    renderCall();

    expect(createRendererSpy.mock.results.length).toBe(1);
    const renderer = await createRendererSpy.mock.results[0].value;
    await vi.runAllTimersAsync(); // wait for the createRenderer.then so the rendererRef is set
    return renderer;
  };
});
