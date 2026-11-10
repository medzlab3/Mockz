import * as THREE from 'three';
import { BookSettings, FORMAT_DIMENSIONS, PageSlot } from '../types';
import { createDefaultPageTexture, loadUserTexture, clearTextureCache } from '../utils/textureGenerator';

interface LeafMeshGroup {
  pivot: THREE.Group;
  leafGroup: THREE.Group;
  frontMesh: THREE.Mesh;
  backMesh: THREE.Mesh;
  edgesGroup: THREE.Group;
  sheetIndex: number;
  targetAngle: number;
  currentAngle: number;
}

export class Book3DModel {
  public root: THREE.Group;
  private leaves: LeafMeshGroup[] = [];
  private settings: BookSettings;
  private pages: PageSlot[];
  private textures: (THREE.Texture | null)[] = [];
  private shadowPlane: THREE.Mesh | null = null;
  private spineMesh: THREE.Mesh | null = null;
  private buildGeneration: number = 0;

  private targetCenterX: number = 0;
  private currentCenterX: number = 0;

  constructor(settings: BookSettings, pages: PageSlot[]) {
    this.root = new THREE.Group();
    this.settings = { ...settings };
    this.pages = [...pages];
  }

  public async rebuildFull(settings: BookSettings, pages: PageSlot[]) {
    this.settings = { ...settings };
    this.pages = [...pages];

    this.buildGeneration++;
    const myGen = this.buildGeneration;

    this.disposeContents();
    clearTextureCache();

    await this.loadAllTextures();
    if (this.buildGeneration !== myGen) return;

    this.buildGeometry();
    this.applyTexturesToLeaves();
    this.updateAngles(true);
  }

  public updateLightSettings(settings: BookSettings) {
    this.settings = { ...settings };
    this.updateAngles();
  }

  public update(deltaTime: number) {
    const lerpSpeed = Math.min(1.0, deltaTime * 14);

    // Smooth center adjustment (centers closed book, open spread, or closed back)
    if (Math.abs(this.currentCenterX - this.targetCenterX) > 0.0001) {
      this.currentCenterX += (this.targetCenterX - this.currentCenterX) * lerpSpeed;
      this.root.position.x = this.currentCenterX;
    }

    // Smooth leaf turns
    for (const leaf of this.leaves) {
      if (Math.abs(leaf.currentAngle - leaf.targetAngle) > 0.0001) {
        leaf.currentAngle += (leaf.targetAngle - leaf.currentAngle) * lerpSpeed;
        leaf.pivot.rotation.y = leaf.currentAngle;

        // Subtle realistic curl during motion
        const bendIntensity =
          this.settings.paperWeight === 120 ? 0.04 :
          this.settings.paperWeight === 250 ? 0.012 : 0.003;
        const progress = Math.abs(leaf.currentAngle / Math.PI);
        const curl = Math.sin(progress * Math.PI) * bendIntensity;
        leaf.leafGroup.rotation.z = -curl * 0.2;
      }
    }
  }

  public dispose() {
    this.disposeContents();
  }

  private disposeContents() {
    this.root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      }
    });
    while (this.root.children.length > 0) {
      this.root.remove(this.root.children[0]);
    }
    this.leaves = [];
    this.shadowPlane = null;
    this.spineMesh = null;
  }

  private async loadAllTextures() {
    for (const tex of this.textures) {
      if (tex) tex.dispose();
    }
    this.textures = [];

    for (const page of this.pages) {
      if (page.imageUrl) {
        try {
          const tex = await loadUserTexture(page.imageUrl);
          tex.anisotropy = 16;
          this.textures.push(tex);
        } catch {
          this.textures.push(createDefaultPageTexture(page, this.settings.paperFinish));
        }
      } else {
        this.textures.push(createDefaultPageTexture(page, this.settings.paperFinish));
      }
    }
  }

  private applyTexturesToLeaves() {
    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];

      // Sheet i has Recto (P. 2i + 1) and Verso (P. 2i + 2)
      const frontPageIndex = i * 2;
      const backPageIndex = i * 2 + 1;

      const frontTex = this.textures[frontPageIndex] || null;
      const backTex = this.textures[backPageIndex] || null;

      const frontMat = leaf.frontMesh.material as THREE.MeshStandardMaterial;
      frontMat.map = frontTex;
      frontMat.needsUpdate = true;

      const backMat = leaf.backMesh.material as THREE.MeshStandardMaterial;
      backMat.map = backTex;
      backMat.needsUpdate = true;
    }
  }

  private buildGeometry() {
    const { width, height } = FORMAT_DIMENSIONS[this.settings.format] || FORMAT_DIMENSIONS.a5;
    const numSheets = Math.ceil(this.settings.pageCount / 2);
    const sheetThickness = 0.0035 * (this.settings.paperWeight / 120);

    // Ground shadow plane
    const shadowGeo = new THREE.PlaneGeometry(width * 3.8, height * 2.6);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -height / 2 - 0.01;
    this.shadowPlane.receiveShadow = true;
    this.root.add(this.shadowPlane);

    // Spine rod (reliure centrale)
    const spineRadius = Math.max(0.012, numSheets * sheetThickness * 0.7);
    const spineGeo = new THREE.CylinderGeometry(spineRadius, spineRadius, height, 32);
    const spineMat = this.createPaperMaterial(true);
    this.spineMesh = new THREE.Mesh(spineGeo, spineMat);
    this.spineMesh.castShadow = true;
    this.spineMesh.receiveShadow = true;
    this.root.add(this.spineMesh);

    // Create sheets: ALL sheets share pivot.position.z = 0 at the spine
    for (let i = 0; i < numSheets; i++) {
      const leaf = this.createLeaf(i, width, height, sheetThickness);
      this.leaves.push(leaf);
      this.root.add(leaf.pivot);
    }
  }

  /**
   * Builds a single leaf. Pivot is exactly at (0, 0, 0) on the spine.
   * This mathematically prevents any diagonal crossing or cut in half.
   */
  private createLeaf(
    sheetIndex: number,
    width: number,
    height: number,
    thickness: number
  ): LeafMeshGroup {
    const pivot = new THREE.Group();
    // Identical pivot point at the spine axis for all sheets
    pivot.position.set(0, 0, 0);

    const leafGroup = new THREE.Group();

    const segX = 16;
    const segY = 2;

    // RECTO face (+Z)
    const frontGeo = new THREE.PlaneGeometry(width, height, segX, segY);
    frontGeo.translate(width / 2, 0, thickness / 2);

    // VERSO face (-Z)
    const backGeo = new THREE.PlaneGeometry(width, height, segX, segY);
    backGeo.rotateY(Math.PI);
    backGeo.translate(width / 2, 0, -thickness / 2);

    const frontMat = this.createPaperMaterial();
    const backMat = this.createPaperMaterial();

    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;

    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;

    // Edges (top, bottom, outer edge only — 0 Z-fighting)
    const edgesGroup = new THREE.Group();
    const edgeMat = this.createPaperMaterial(true);

    const topGeo = new THREE.PlaneGeometry(width, thickness);
    topGeo.rotateX(-Math.PI / 2);
    topGeo.translate(width / 2, height / 2, 0);
    edgesGroup.add(new THREE.Mesh(topGeo, edgeMat));

    const bottomGeo = new THREE.PlaneGeometry(width, thickness);
    bottomGeo.rotateX(Math.PI / 2);
    bottomGeo.translate(width / 2, -height / 2, 0);
    edgesGroup.add(new THREE.Mesh(bottomGeo, edgeMat));

    const outerGeo = new THREE.PlaneGeometry(thickness, height);
    outerGeo.rotateY(Math.PI / 2);
    outerGeo.translate(width, 0, 0);
    edgesGroup.add(new THREE.Mesh(outerGeo, edgeMat));

    edgesGroup.children.forEach((c) => { (c as THREE.Mesh).castShadow = true; });

    leafGroup.add(frontMesh);
    leafGroup.add(backMesh);
    leafGroup.add(edgesGroup);
    pivot.add(leafGroup);

    return {
      pivot,
      leafGroup,
      frontMesh,
      backMesh,
      edgesGroup,
      sheetIndex,
      targetAngle: 0,
      currentAngle: 0,
    };
  }

  private createPaperMaterial(isEdge: boolean = false): THREE.MeshStandardMaterial {
    let roughness = 0.75;
    const metalness = 0.02;

    switch (this.settings.paperFinish) {
      case 'glossy':   roughness = 0.18; break;
      case 'kraft':    roughness = 0.90; break;
      case 'textured': roughness = 0.85; break;
    }

    return new THREE.MeshStandardMaterial({
      color: this.settings.paperFinish === 'kraft' ? 0xd2b48c : 0xfcfbf9,
      roughness: isEdge ? 0.95 : roughness,
      metalness,
      side: THREE.FrontSide,
    });
  }

  /**
   * Sets target rotation for each leaf and auto-centers the book.
   *
   * Spread state logic:
   *   k = 0 : Closed on Cover (Page 1)
   *   1 <= k < numSheets : Open spread between Sheet k-1 (left) and Sheet k (right)
   *   k = numSheets : Closed on Back Cover (Page N)
   */
  public updateAngles(instant: boolean = false) {
    const numSheets = this.leaves.length;
    if (numSheets === 0) return;

    const formatDims = FORMAT_DIMENSIONS[this.settings.format] || FORMAT_DIMENSIONS.a5;
    const width = formatDims.width;
    const k = Math.min(numSheets, Math.max(0, typeof this.settings.currentSpread === 'number' ? this.settings.currentSpread : 1));
    const openDeg = Math.min(180, Math.max(0, typeof this.settings.openAngle === 'number' && !isNaN(this.settings.openAngle) ? this.settings.openAngle : 90));
    const delta = 0.0035; // Fine angular offset between stacked sheets (zero clipping)

    if (k === 0) {
      // ── SPREAD 0: CLOSED ON FRONT COVER (Page 1) ──
      // Sheet 0 is the front cover.
      // delta stacking: theta increases with i so Sheet 0 has the smallest angle (0 rad),
      // putting Sheet 0 in front (+Z) and Sheet 1..N tucked safely behind in -Z.
      const u = openDeg / 180;
      const coverLift = (u > 0) ? -u * Math.PI : 0;
      this.leaves[0].targetAngle = coverLift;
      for (let i = 1; i < numSheets; i++) {
        this.leaves[i].targetAngle = i * delta;
      }

      // Center the closed cover in the viewport
      this.targetCenterX = (u > 0) ? -(1 - u) * (width / 2) : -width / 2;
    } else if (k === numSheets) {
      // ── SPREAD N: CLOSED ON BACK COVER (Page N) ──
      // All sheets have turned to the left stack. Sheet numSheets-1 is on top.
      for (let i = 0; i < numSheets; i++) {
        this.leaves[i].targetAngle = -Math.PI + (i * delta);
      }

      // Center the closed back cover in the viewport
      this.targetCenterX = width / 2;
    } else {
      // ── SPREADS 1 TO numSheets - 1 : SYMMETRIC OPEN SPREAD ──
      // u: 0 = closed flat (0°), 0.5 = standing V-shape (90°), 1 = flat open on table (180°)
      const u = openDeg / 180;
      const baseRight = -(1 - u) * u * Math.PI;
      const baseLeft = baseRight - (u * Math.PI);

      for (let i = 0; i < numSheets; i++) {
        const leaf = this.leaves[i];
        if (i < k) {
          // Left stack: sheet k-1 is on top facing viewer, sheets below have smaller i
          leaf.targetAngle = baseLeft + (i * delta);
        } else {
          // Right stack: sheet k is on top facing viewer, sheets below have larger i
          leaf.targetAngle = baseRight + (i * delta);
        }
      }

      // Smooth center adjustment: at u=1, centered at spine (0); at u=0, centered on closed cover (-width/2)
      this.targetCenterX = -(1 - u) * (width / 2);
    }

    if (instant) {
      for (const leaf of this.leaves) {
        leaf.currentAngle = leaf.targetAngle;
        leaf.pivot.rotation.y = leaf.targetAngle;
      }
      this.currentCenterX = this.targetCenterX;
      this.root.position.x = this.targetCenterX;
    }
  }
}
