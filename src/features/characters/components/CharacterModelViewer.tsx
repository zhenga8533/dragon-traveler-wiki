import {
  Bounds,
  Center,
  Html,
  OrbitControls,
  useAnimations,
  useBounds,
  useGLTF,
} from '@react-three/drei';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import {
  ActionIcon,
  Box,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  LuPause,
  LuPlay,
  LuRefreshCw,
  LuRotate3D,
  LuScan,
} from 'react-icons/lu';
import {
  DataTexture,
  BackSide,
  LoopOnce,
  Mesh,
  Object3D,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  UnsignedByteType,
  Vector3,
} from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { getAssetUrl, getCharacterModelAssetPath } from '@/assets';
import { useAssetManifest } from '@/hooks/use-asset-manifest';
import { useGradientAccent } from '@/hooks';
import type { AssetManifestEntry } from '@/types/asset-manifest';

interface ModelAnimation {
  name: string;
  label: string;
  loop: boolean;
  default: boolean;
}

interface ModelMetadata {
  version: 1 | 2;
  model: string;
  textures: Record<string, string>;
  animations: ModelAnimation[];
  material: {
    indirectLight: number;
    emissionStrength: number;
    shadowThreshold: number;
    shadowSoftness: number;
  };
}

interface CharacterModelViewerProps {
  characterSlug: string;
  skinSlug: string | null;
  onViewerClose: () => void;
}

const vertexShader = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
    #include <begin_vertex>
    #include <skinning_vertex>
    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D baseMap;
  uniform sampler2D shadeMap;
  uniform sampler2D emissionMap;
  uniform sampler2D mraMap;
  uniform vec3 lightDirection;
  uniform float emissionStrength;
  uniform float indirectLight;
  uniform float shadowThreshold;
  uniform float shadowSoftness;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 base = texture2D(baseMap, vUv);
    vec3 authoredShade = texture2D(shadeMap, vUv).rgb;
    vec3 emission = texture2D(emissionMap, vUv).rgb;
    vec3 mra = texture2D(mraMap, vUv).rgb;
    vec3 normal = normalize(vWorldNormal);
    vec3 light = normalize(lightDirection);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 halfDirection = normalize(light + viewDirection);
    float halfLambert = dot(normal, light) * 0.5 + 0.5;
    float toonLight = smoothstep(shadowThreshold - shadowSoftness, shadowThreshold + shadowSoftness, halfLambert);
    vec3 color = mix(mix(authoredShade, base.rgb, indirectLight), base.rgb, toonLight);
    float metallic = mra.r;
    float roughness = clamp(mra.g, 0.04, 1.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), mix(96.0, 8.0, roughness));
    color += mix(vec3(0.04), base.rgb, metallic) * specular * toonLight * 0.22;
    color += base.rgb * pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0) * toonLight * 0.08;
    color += emission * emissionStrength;
    gl_FragColor = vec4(color, base.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const outlineVertexShader = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
  void main() {
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    transformed += objectNormal * 0.001;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const outlineFragmentShader = /* glsl */ `
  void main() {
    gl_FragColor = vec4(0.055, 0.04, 0.075, 1.0);
  }
`;

function versionedUrl(path: string, entry?: AssetManifestEntry): string {
  const url = getAssetUrl(path);
  return entry ? `${url}?v=${entry.sha256.slice(0, 12)}` : url;
}

function neutralTexture(r: number, g: number, b: number): DataTexture {
  const texture = new DataTexture(
    new Uint8Array([r, g, b, 255]),
    1,
    1,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.needsUpdate = true;
  return texture;
}

function CharacterModel({
  metadata,
  rootPath,
  entries,
  selectedAnimation,
  animationRun,
  paused,
  onAnimationFinished,
}: {
  metadata: ModelMetadata;
  rootPath: string;
  entries: Record<string, AssetManifestEntry>;
  selectedAnimation: string;
  animationRun: number;
  paused: boolean;
  onAnimationFinished: () => void;
}) {
  const modelPath = `${rootPath}/${metadata.model}`;
  const modelUrl = versionedUrl(modelPath, entries[modelPath]);
  const textureSemantics = Object.keys(metadata.textures);
  const textureUrls = textureSemantics.map((semantic) => {
    const path = `${rootPath}/${metadata.textures[semantic]}`;
    return versionedUrl(path, entries[path]);
  });
  const loadedTextures = useLoader(TextureLoader, textureUrls);
  const { animations, scene } = useGLTF(modelUrl);
  const fallbackTextures = useMemo(
    () => ({
      emission: neutralTexture(0, 0, 0),
      mra: neutralTexture(0, 180, 0),
    }),
    [],
  );
  const textureMap = useMemo(() => {
    const result: Record<string, Texture> = {};
    textureSemantics.forEach((semantic, index) => {
      result[semantic] = loadedTextures[index];
    });
    return result;
  }, [loadedTextures, textureSemantics]);
  const baseMap = textureMap.base;
  const shadeMap = textureMap.shade ?? baseMap;
  const emissionMap = textureMap.emission ?? fallbackTextures.emission;
  const mraMap = textureMap.mra ?? fallbackTextures.mra;
  const { material, outlineMaterial, model } = useMemo(() => {
    for (const texture of [baseMap, shadeMap, emissionMap, mraMap]) {
      texture.flipY = false;
    }
    for (const texture of [baseMap, shadeMap, emissionMap]) {
      texture.colorSpace = SRGBColorSpace;
    }
    const toonMaterial = new ShaderMaterial({
      name: 'Dragon Traveler actor toon material',
      uniforms: {
        baseMap: { value: baseMap },
        shadeMap: { value: shadeMap },
        emissionMap: { value: emissionMap },
        mraMap: { value: mraMap },
        lightDirection: { value: new Vector3(0.7, 1, 0.8).normalize() },
        emissionStrength: { value: metadata.material.emissionStrength },
        indirectLight: { value: metadata.material.indirectLight },
        shadowThreshold: { value: metadata.material.shadowThreshold },
        shadowSoftness: { value: metadata.material.shadowSoftness },
      },
      vertexShader,
      fragmentShader,
    });
    const silhouetteMaterial = new ShaderMaterial({
      name: 'Dragon Traveler subtle silhouette outline',
      vertexShader: outlineVertexShader,
      fragmentShader: outlineFragmentShader,
      side: BackSide,
    });
    const clone = cloneSkeleton(scene);
    const meshes: Mesh[] = [];
    clone.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.material = toonMaterial;
        meshes.push(child);
      }
    });
    for (const mesh of meshes) {
      const outline = mesh.clone();
      outline.name = `${mesh.name || 'mesh'} outline`;
      outline.material = silhouetteMaterial;
      outline.renderOrder = -1;
      mesh.parent?.add(outline);
    }
    return {
      material: toonMaterial,
      outlineMaterial: silhouetteMaterial,
      model: clone,
    };
  }, [baseMap, emissionMap, metadata.material, mraMap, scene, shadeMap]);
  const { actions, mixer } = useAnimations(animations, model);

  useEffect(() => {
    const definition = metadata.animations.find(
      (animation) => animation.name === selectedAnimation,
    );
    const action = actions[selectedAnimation];
    if (!definition || !action) return;
    action.reset();
    if (!definition.loop) {
      action.setLoop(LoopOnce, 1);
    }
    action.fadeIn(0.15).play();
    const handleFinished = () => onAnimationFinished();
    mixer.addEventListener('finished', handleFinished);
    return () => {
      mixer.removeEventListener('finished', handleFinished);
      action.fadeOut(0.15);
    };
  }, [
    actions,
    animationRun,
    metadata.animations,
    mixer,
    onAnimationFinished,
    selectedAnimation,
  ]);

  useEffect(() => {
    const action = actions[selectedAnimation];
    action?.setEffectiveTimeScale(paused ? 0 : 1);
    return () => {
      action?.setEffectiveTimeScale(1);
    };
  }, [actions, paused, selectedAnimation]);

  useEffect(
    () => () => {
      material.dispose();
      outlineMaterial.dispose();
      fallbackTextures.emission.dispose();
      fallbackTextures.mra.dispose();
    },
    [fallbackTextures, material, outlineMaterial],
  );

  return (
    <Center top>
      <primitive object={model} />
    </Center>
  );
}

function CameraFit({
  request,
  onReady,
}: {
  request: number;
  onReady: () => void;
}) {
  const bounds = useBounds();
  const camera = useThree((state) => state.camera);
  const get = useThree((state) => state.get);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  useEffect(() => {
    let resetFrame = 0;
    let readyFrame = 0;
    const reset = () => {
      const controls = get().controls as unknown as {
        target: Vector3;
        update: () => void;
      } | null;
      if (!controls) {
        resetFrame = requestAnimationFrame(reset);
        return;
      }
      const { center, distance } = bounds.refresh().getSize();
      const viewDirection = new Vector3(0, 0.9, 2.2).sub(center).normalize();

      camera.up.set(0, 1, 0);
      camera.position.copy(center).addScaledVector(viewDirection, distance);
      controls.target.copy(center);
      bounds.clip();
      readyFrame = requestAnimationFrame(onReady);
    };
    resetFrame = requestAnimationFrame(reset);
    return () => {
      cancelAnimationFrame(resetFrame);
      cancelAnimationFrame(readyFrame);
    };
  }, [bounds, camera, get, height, onReady, request, width]);

  return null;
}

function ModelLoadingState() {
  return (
    <Html center>
      <Group gap="xs" wrap="nowrap">
        <Loader size="sm" />
        <Text c="dimmed" size="sm" style={{ whiteSpace: 'nowrap' }}>
          Loading model…
        </Text>
      </Group>
    </Html>
  );
}

function parseMetadata(raw: unknown): ModelMetadata {
  const value = raw as Partial<ModelMetadata>;
  if (
    (value.version !== 1 && value.version !== 2) ||
    !value.model ||
    !value.textures ||
    !value.animations ||
    !value.material
  ) {
    throw new Error('Unsupported character model metadata');
  }
  return value as ModelMetadata;
}

export default function CharacterModelViewer({
  characterSlug,
  skinSlug,
  onViewerClose,
}: CharacterModelViewerProps) {
  const { accent } = useGradientAccent();
  const manifest = useAssetManifest();
  const metadataPath = skinSlug
    ? getCharacterModelAssetPath(characterSlug, skinSlug)
    : '';
  const metadataEntry = manifest.data.assets[metadataPath];
  const [loadedMetadata, setLoadedMetadata] = useState<{
    path: string;
    value: ModelMetadata | null;
  }>({ path: '', value: null });
  const [metadataError, setMetadataError] = useState<{
    path: string;
    message: string;
  } | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState('');
  const [animationRun, setAnimationRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cameraFitRequest, setCameraFitRequest] = useState(0);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    if (!metadataEntry) return;
    const controller = new AbortController();
    fetch(versionedUrl(metadataPath, metadataEntry), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(parseMetadata)
      .then((value) => {
        setLoadedMetadata({ path: metadataPath, value });
        setPaused(false);
        setSelectedAnimation(
          value.animations.find((animation) => animation.default)?.name ??
            value.animations[0]?.name ??
            '',
        );
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error(`Failed to load ${metadataPath}:`, error);
        setLoadedMetadata({ path: metadataPath, value: null });
        setMetadataError({
          path: metadataPath,
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return () => controller.abort();
  }, [metadataEntry, metadataPath]);

  const selectAnimation = useCallback((animation: string) => {
    setSelectedAnimation(animation);
    setPaused(false);
    setAnimationRun((run) => run + 1);
  }, []);
  const handleAnimationFinished = useCallback(() => {
    const animations = loadedMetadata.value?.animations ?? [];
    const fallback =
      animations.find((animation) => animation.default)?.name ??
      animations[0]?.name;
    if (fallback) selectAnimation(fallback);
  }, [loadedMetadata.value, selectAnimation]);
  const closeViewer = useCallback(() => {
    setModelReady(false);
    onViewerClose();
  }, [onViewerClose]);
  const handleInitialCameraFit = useCallback(() => {
    setModelReady(true);
  }, []);
  const handleViewerOpened = useCallback(() => {
    setModelReady(false);
    setCameraFitRequest((request) => request + 1);
  }, []);

  const metadata =
    loadedMetadata.path === metadataPath ? loadedMetadata.value : null;
  const currentMetadataError =
    metadataError?.path === metadataPath ? metadataError.message : null;
  if (manifest.loading || !skinSlug || !metadataEntry) return null;
  const rootPath = metadataPath.slice(0, metadataPath.lastIndexOf('/'));

  return (
    <Modal
      centered
      onClose={closeViewer}
      onEnterTransitionEnd={handleViewerOpened}
      opened
      size="xl"
      title={<Text fw={700}>3D Model</Text>}
    >
      {!metadata ? (
        <Stack align="center" justify="center" mih={440}>
          {currentMetadataError ? (
            <>
              <Text fw={600}>The model could not be loaded</Text>
              <Text c="dimmed" size="sm" ta="center">
                {currentMetadataError}
              </Text>
            </>
          ) : (
            <>
              <Loader color={accent.primary} />
              <Text c="dimmed" size="sm">
                Loading model data…
              </Text>
            </>
          )}
        </Stack>
      ) : (
        <Box style={{ overflow: 'hidden' }}>
          <Group justify="space-between" gap="sm" mb="sm">
            <Group gap={6} wrap="nowrap">
              <LuRotate3D aria-hidden size={13} />
              <Text c="dimmed" size="xs">
                Drag to rotate · Scroll to zoom
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              {metadata.animations.length > 1 && (
                <Select
                  aria-label="Model animation"
                  data={metadata.animations.map((animation) => ({
                    value: animation.name,
                    label: animation.label,
                  }))}
                  value={selectedAnimation}
                  onChange={(value) => value && selectAnimation(value)}
                  size="xs"
                  w={{ base: 145, sm: 190 }}
                  allowDeselect={false}
                />
              )}
              <Tooltip label={paused ? 'Resume animation' : 'Pause animation'}>
                <ActionIcon
                  aria-label={paused ? 'Resume animation' : 'Pause animation'}
                  color={accent.primary}
                  onClick={() => setPaused((value) => !value)}
                  variant="subtle"
                >
                  {paused ? <LuPlay /> : <LuPause />}
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Replay animation">
                <ActionIcon
                  aria-label="Replay animation"
                  color={accent.primary}
                  onClick={() => {
                    setPaused(false);
                    setAnimationRun((run) => run + 1);
                  }}
                  variant="subtle"
                >
                  <LuRefreshCw />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Reset camera">
                <ActionIcon
                  aria-label="Reset model camera"
                  color={accent.primary}
                  onClick={() => setCameraFitRequest((request) => request + 1)}
                  variant="subtle"
                >
                  <LuScan />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
          <Box h={{ base: 440, sm: 620 }} pos="relative">
            {!modelReady && (
              <Stack
                align="center"
                gap="xs"
                inset={0}
                justify="center"
                pos="absolute"
              >
                <Loader color={accent.primary} size="sm" />
                <Text c="dimmed" size="sm">
                  Preparing viewer…
                </Text>
              </Stack>
            )}
            <Canvas
              camera={{ position: [0, 0.9, 2.2], fov: 32 }}
              dpr={[1, 2]}
              style={{ opacity: modelReady ? 1 : 0 }}
            >
              {/* three.js scene background — can't reference CSS vars; intentionally static across light/dark */}
              <color attach="background" args={['#15111d']} />
              <OrbitControls makeDefault enablePan={false} minDistance={0.5} />
              <Suspense fallback={<ModelLoadingState />}>
                <Bounds clip observe margin={1.12}>
                  <CharacterModel
                    key={`${rootPath}/${metadata.model}`}
                    metadata={metadata}
                    rootPath={rootPath}
                    entries={manifest.data.assets}
                    selectedAnimation={selectedAnimation}
                    animationRun={animationRun}
                    paused={paused}
                    onAnimationFinished={handleAnimationFinished}
                  />
                  <CameraFit
                    request={cameraFitRequest}
                    onReady={handleInitialCameraFit}
                  />
                </Bounds>
              </Suspense>
            </Canvas>
          </Box>
        </Box>
      )}
    </Modal>
  );
}
