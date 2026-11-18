export type MockupCategory =
  | 'todas'
  | 'sacolinhas'
  | 'caixinhas'
  | 'centros-de-mesa'
  | 'tags'
  | 'embalagens'
  | 'papelaria'
  | 'festas'
  | 'outros';

export interface Point2D {
  x: number;
  y: number;
}

export interface Quad2D {
  p0: Point2D; // Top-left
  p1: Point2D; // Top-right
  p2: Point2D; // Bottom-right
  p3: Point2D; // Bottom-left
}

export type FaceArtMode = 'cover' | 'contain' | 'repeat' | 'crop_top' | 'crop_center' | 'crop_bottom' | 'continuous_wrap';

export type ArtFitMode = 'cover' | 'contain' | 'smart-cover';

export type ArtFocalStrategy = 
  | 'center' 
  | 'upper-center' 
  | 'lower-center' 
  | 'pyramid-balanced' 
  | 'auto-face-region';

export interface SafeMargins {
  top: number;    // 0 to 1 fraction of printable height
  right: number;  // 0 to 1 fraction of printable width
  bottom: number; // 0 to 1 fraction of printable height
  left: number;   // 0 to 1 fraction of printable width
}

export interface ArtPlacementConfig {
  printableBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  safeMargins?: SafeMargins;
  fitMode?: ArtFitMode;
  focalStrategy?: ArtFocalStrategy;
  bleed?: number; // e.g. 0.015 (1.5% bleed margin)
  optionalTopRegions?: {
    enabled: boolean;
    printable: boolean;
    heightRatio?: number;
  };
  optionalSideRegions?: {
    enabled: boolean;
    printable: boolean;
    widthRatio?: number;
  };
}

export interface MockupFace {
  id: string;
  name: string;
  // Normalized destination quad for perspective mapping (0 to 1000 relative to canvas bounding box)
  quad: Quad2D;
  // Optional clipping polygon (if the face is not a strict quad, e.g. scalloped or triangle)
  clipPolygon?: Point2D[];
  // Source crop area from the user's art (0 to 1 relative to source image)
  sourceSubRect?: { x: number; y: number; width: number; height: number };
  // Continuous Wrap texture slice (portion of unfolded virtual texture: 0 to 1)
  textureSlice?: {
    startX: number; // e.g. 0 for left side, 0.35 for front, etc.
    endX: number;   // e.g. 0.35 for left side, 1.0 for front
    startY?: number; // default 0
    endY?: number;   // default 1
  };
  // Placement rules tailored for this face
  artPlacementConfig?: ArtPlacementConfig;
  // Indicates whether this surface receives the printable artwork (defaults to true)
  // Structural parts (like top roof folds, handles, flaps) should be printable: false
  printable?: boolean;
  // Base physical surface color (defaults to template.baseColor or '#fafafb')
  baseColor?: string;
  // Shading multiplier / color overlay (e.g. 'rgba(0,0,0,0.22)' for side faces)
  shadingColor?: string;
  // Light angle gradient overlay
  gradientShade?: {
    start: Point2D;
    end: Point2D;
    startColor: string;
    endColor: string;
  };
  artMode?: FaceArtMode;
  flipX?: boolean;
  flipY?: boolean;
}

export interface MockupCrease {
  p1: Point2D;
  p2: Point2D;
  color?: string;
  width?: number;
  type?: 'inner_shadow' | 'outer_highlight' | 'die_cut';
}

export interface MockupHighlight {
  type: 'linear' | 'radial' | 'polygon';
  points?: Point2D[];
  colorStart: string;
  colorEnd: string;
  start: Point2D;
  end: Point2D;
  blendMode?: GlobalCompositeOperation;
}

export interface MockupOverlayElement {
  type: 'handle_ribbon' | 'handle_cord' | 'ziplock_seal' | 'acetate_window' | 'bow_tie' | 'hole_punch' | 'custom_svg' | 'custom_image';
  points?: Point2D[];
  color?: string;
  svgPath?: string;
  imageUrl?: string;
  opacity?: number;
  zIndex?: number;
}

export interface MockupShadow {
  type: 'floor_contact' | 'floor_soft' | 'ambient_occlusion';
  bounds: { x: number; y: number; width: number; height: number; blur: number; opacity: number };
  ellipse?: { cx: number; cy: number; rx: number; ry: number; blur: number; opacity: number };
}

export interface SeamConfig {
  frontEdge: 'right' | 'left';
  sideEdge: 'left' | 'right';
  direction: 'front-to-side' | 'side-to-front';
  seamPoint: number;
}

export interface SurfaceConfig {
  quad: Quad2D;
  rectifiedWidth: number;
  rectifiedHeight: number;
  aspectRatio: number;
  confidence: number;
}

export interface MockupTemplate {
  id: string;
  name: string;
  slug: string;
  category: MockupCategory;
  subcategory?: string;
  description: string;
  tagSize?: string;
  // Summary of detectable faces to show as badges (e.g. ['Frente', 'Lateral'] or ['Frente'])
  facesSummary?: string[];
  // Seam configuration between faces
  seamConfig?: SeamConfig;
  // Placement configuration for artwork framing, safe areas, focal points and bleed
  artPlacementConfig?: ArtPlacementConfig;
  // Product canvas bounding box in normalized coordinates (0 to 1000)
  canvasSize: { width: number; height: number };
  // Product outer silhouette for base rendering
  basePolygon?: Point2D[];
  baseColor?: string;
  // Base photo/render if it's a custom user model
  baseImageUrl?: string;
  // Printable faces with perspective definitions
  faces: MockupFace[];
  // Crease fold lines
  creases?: MockupCrease[];
  // Highlights and gloss reflections
  highlights?: MockupHighlight[];
  // Drop shadows on the floor
  shadows?: MockupShadow[];
  // Details on top of art (handles, ribbons, seals, acetate windows)
  overlays?: MockupOverlayElement[];
  // Flags for user custom models
  isCustomModel?: boolean;
  userId?: string;
  frontImageUrl?: string;
  sideImageUrl?: string;
  active: boolean;
}

export interface UserMockupModel {
  id: string;
  userId: string;
  name: string;
  category: MockupCategory;
  subcategory?: string;
  description?: string;
  frontImageUrl: string;
  sideImageUrl?: string;
  thumbnailUrl?: string;
  hasSide: boolean;
  facesSummary: string[];
  frontSurfaceConfig?: SurfaceConfig;
  sideSurfaceConfig?: SurfaceConfig;
  seamConfig?: SeamConfig;
  template: MockupTemplate;
  status: 'ready' | 'processing' | 'error';
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModelAnalysisResult {
  name: string;
  category: MockupCategory;
  hasSide: boolean;
  facesSummary: string[];
  frontSurfaceConfig?: SurfaceConfig;
  sideSurfaceConfig?: SurfaceConfig;
  seamConfig?: SeamConfig;
  confidence: number;
  template: MockupTemplate;
}

export type MockupBackgroundType = 'atelie' | 'white' | 'transparent' | 'custom';

export type MockupOutputRatio = 'square' | 'feed' | 'stories';

export interface MockupRenderOptions {
  template: MockupTemplate;
  userArtImage: HTMLImageElement | null;
  backgroundType: MockupBackgroundType;
  customBgImage?: HTMLImageElement | null;
  baseProductImage?: HTMLImageElement | null;
  outputRatio: MockupOutputRatio;
  quality?: 'standard' | 'high';
}

export interface ExportResolution {
  width: number;
  height: number;
  label: string;
  aspectRatio: string;
}
