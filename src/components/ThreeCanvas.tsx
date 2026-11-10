import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BookSettings, PageSlot, FORMAT_DIMENSIONS, PageFormat } from '../types';
import { Book3DModel } from './Book3D';

export interface ThreeCanvasHandle {
  exportImage: (format?: 'png' | 'jpeg') => string | null;
  resetCamera: (preset?: 'perspective' | 'front' | 'top' | 'spine') => void;
  centerInView: () => void;
}

interface ThreeCanvasProps {
  settings: BookSettings;
  pages: PageSlot[];
  onCanvasReady?: () => void;
}

function getOptimalCameraDistance(
  format: PageFormat,
  aspect: number,
  openAngle: number = 0
): number {
  const dims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.a5;
  const isOpened = openAngle > 10;
  // A book when opened has width ~ 2 * page width; closed is 1 * page width
  const bookWidth = isOpened ? dims.width * 2.15 : dims.width * 1.35;
  const bookHeight = dims.height * 1.35;

  const fovRad = THREE.MathUtils.degToRad(38 / 2);
  const tanFov = Math.tan(fovRad);

  const distV = bookHeight / (2 * tanFov);
  const distH = bookWidth / (2 * tanFov * Math.max(0.2, aspect));

  return Math.max(distV, distH, 3.2);
}

export const ThreeCanvas = forwardRef<ThreeCanvasHandle, ThreeCanvasProps>(
  ({ settings, pages, onCanvasReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const bookModelRef = useRef<Book3DModel | null>(null);
    const animFrameIdRef = useRef<number | null>(null);

    // Live refs so the animation loop always reads the LATEST values
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      exportImage: (format = 'png') => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL(`image/${format}`, 0.95);
      },
      centerInView: () => {
        if (!cameraRef.current || !controlsRef.current || !containerRef.current) return;
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        const container = containerRef.current;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        const aspect = w / Math.max(1, h);

        const optimalDist = getOptimalCameraDistance(
          settingsRef.current.format,
          aspect,
          settingsRef.current.openAngle
        );

        controls.target.set(0, 0, 0);
        camera.position.set(0, 0, optimalDist);
        controls.update();
      },
      resetCamera: (preset = 'front') => {
        if (!cameraRef.current || !controlsRef.current || !containerRef.current) return;
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        const container = containerRef.current;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        const aspect = w / Math.max(1, h);

        const baseDist = getOptimalCameraDistance(
          settingsRef.current.format,
          aspect,
          settingsRef.current.openAngle
        );

        controls.target.set(0, 0, 0);
        if (preset === 'perspective') {
          camera.position.set(baseDist * 0.7, baseDist * 0.65, baseDist * 1.1);
        } else if (preset === 'front') {
          camera.position.set(0, 0, baseDist);
        } else if (preset === 'top') {
          camera.position.set(0, baseDist * 1.4, 0.01);
        } else if (preset === 'spine') {
          camera.position.set(-baseDist * 1.2, 0, 0);
        }
        controls.update();
      },
    }));

    // ──────────────────────────────────────────────────────────────────
    //  ONE-TIME MOUNT: create scene, renderer, lights, controls, loop
    // ──────────────────────────────────────────────────────────────────
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // Scene
      const scene = new THREE.Scene();
      updateSceneBackground(scene, settingsRef.current.backgroundTheme);
      sceneRef.current = scene;

      // Camera: calibrated distance ensures the book is never cropped on mobile or desktop
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / Math.max(1, h);

      const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
      const d0 = getOptimalCameraDistance(
        settingsRef.current.format,
        aspect,
        settingsRef.current.openAngle
      );
      camera.position.set(0, 0, d0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      rendererRef.current = renderer;

      // OrbitControls
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.1;
      controls.minDistance = 2.0;
      controls.maxDistance = 25.0;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 1.2;
      controlsRef.current = controls;

      // Studio lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
      keyLight.position.set(6, 10, 8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.bias = -0.00002;
      keyLight.shadow.normalBias = 0.015;
      keyLight.shadow.radius = 2.5;
      const d = 6;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xfff8eb, 1.0);
      fillLight.position.set(-8, 6, -5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
      rimLight.position.set(0, -6, -8);
      scene.add(rimLight);

      // Book model
      const bookModel = new Book3DModel(settingsRef.current, []);
      scene.add(bookModel.root);
      bookModelRef.current = bookModel;

      onCanvasReady?.();

      // Animation loop
      let prevTime = performance.now();
      const animate = (currentTime: number) => {
        const delta = Math.min((currentTime - prevTime) / 1000, 0.1);
        prevTime = currentTime;

        controls.autoRotate = settingsRef.current.autoRotate;
        controls.update();

        bookModel.update(delta);

        renderer.render(scene, camera);
        animFrameIdRef.current = requestAnimationFrame(animate);
      };
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Resize
      const handleResize = () => {
        const rw = container.clientWidth;
        const rh = container.clientHeight;
        if (!rw || !rh) return;
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh);
      };
      const ro = new ResizeObserver(handleResize);
      ro.observe(container);

      return () => {
        ro.disconnect();
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        controls.dispose();
        bookModel.dispose();
        renderer.dispose();
      };
    }, []); // mount only

    // ──────────────────────────────────────────────────────────────────
    //  SINGLE MERGED EFFECT for settings + pages changes
    // ──────────────────────────────────────────────────────────────────
    const prevSettingsRef = useRef<BookSettings | null>(null);
    const prevPagesRef = useRef<PageSlot[] | null>(null);

    useEffect(() => {
      const book = bookModelRef.current;
      if (!book) return;

      if (sceneRef.current) {
        updateSceneBackground(sceneRef.current, settings.backgroundTheme);
      }

      const prev = prevSettingsRef.current;
      const prevPages = prevPagesRef.current;

      const isFirstRender = prev === null;

      const structuralChange = !isFirstRender && prev && (
        settings.format !== prev.format ||
        settings.pageCount !== prev.pageCount ||
        settings.paperFinish !== prev.paperFinish ||
        settings.paperWeight !== prev.paperWeight
      );

      const pagesChanged = pages !== prevPages;

      if (isFirstRender || structuralChange || pagesChanged) {
        book.rebuildFull(settings, pages);
      } else {
        book.updateLightSettings(settings);
      }

      prevSettingsRef.current = settings;
      prevPagesRef.current = pages;
    }, [settings, pages]);

    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full outline-none block" />
      </div>
    );
  }
);

function updateSceneBackground(scene: THREE.Scene, theme: BookSettings['backgroundTheme']) {
  if (theme === 'dark') {
    scene.background = new THREE.Color(0x0a0804);
  } else if (theme === 'light') {
    scene.background = new THREE.Color(0xfcfbf8);
  } else if (theme === 'studio') {
    scene.background = new THREE.Color(0x141009);
  } else {
    scene.background = null;
  }
}
