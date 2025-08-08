import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";

interface StlViewerProps {
  stlUrl: string;
  color?: string; // hex string like #ff9800
  background?: string; // CSS color
  height?: number;
}

const StlViewer: React.FC<StlViewerProps> = ({ stlUrl, color = "#ff9800", background = "transparent", height = 320 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Mesh | null>(null);
  const animationId = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(background), background === "transparent" ? 0 : 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2, 2, 2);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7.5);
    scene.add(ambient);
    scene.add(dir);

    // Ground faint grid
    const grid = new THREE.GridHelper(10, 10, 0x666666, 0x333333);
    grid.position.y = -0.5;
    grid.material.opacity = 0.15;
    // @ts-ignore - transparent exists at runtime
    grid.material.transparent = true;
    scene.add(grid);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      rendererRef.current.setSize(newWidth, height);
      cameraRef.current.aspect = newWidth / height;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Load STL
    const loader = new STLLoader();
    loader.load(
      stlUrl,
      (geometry) => {
        const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness: 0.1, roughness: 0.6 });
        const mesh = new THREE.Mesh(geometry, material);
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Fit camera distance
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.8;
        camera.position.set(distance, distance, distance);
        camera.lookAt(0, 0, 0);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        modelRef.current = mesh;
      },
      undefined,
      (err) => {
        console.error("Error loading STL:", err);
      }
    );

    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.01;
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationId.current) cancelAnimationFrame(animationId.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && rendererRef.current.domElement.parentElement) {
          rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
        }
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      modelRef.current = null;
    };
  }, [stlUrl, color, background, height]);

  // Update color dynamically
  useEffect(() => {
    if (modelRef.current) {
      const material = modelRef.current.material as THREE.MeshStandardMaterial;
      material.color = new THREE.Color(color);
      material.needsUpdate = true;
    }
  }, [color]);

  return <div ref={containerRef} className="w-full rounded-lg border border-input bg-card" style={{ height }} />;
};

export default StlViewer;
