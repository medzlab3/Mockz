import * as THREE from 'three';
import { BookSettings, FORMAT_DIMENSIONS, PageSlot, PaperFinish, PaperWeight } from '../types';
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

    // Smooth leaf turns with physics per paper weight (cover vs inside)
    const numSheets = this.leaves.length;
    for (const leaf of this.leaves) {
      const angleDiff = leaf.targetAngle - leaf.currentAngle;
      if (Math.abs(angleDiff) > 0.0001) {
        leaf.currentAngle += angleDiff * lerpSpeed;
        leaf.pivot.rotation.y = leaf.currentAngle;

        // Dynamic curl ONLY while turning (angle moving)
        if (Math.abs(angleDiff) > 0.005) {
          const leafWeight = this.getSheetWeight(leaf.sheetIndex, numSheets);
          const bendIntensity =
            leafWeight === 120 ? 0.03 :
            leafWeight === 250 ? 0.01 : 0.002;
          const progress = Math.abs(leaf.currentAngle / Math.PI);
          const curl = Math.sin(progress * Math.PI) * bendIntensity;
          leaf.leafGroup.rotation.z = -curl * 0.15;
        } else {
          // Return to flat when resting at target angle (prevents resting scissor-cross)
          leaf.leafGroup.rotation.z += (0 - leaf.leafGroup.rotation.z) * lerpSpeed;
        }
      } else {
        leaf.leafGroup.rotation.z += (0 - leaf.leafGroup.rotation.z) * lerpSpeed;
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

  private isCoverSheet(sheetIndex: number, totalSheets: number): boolean {
    if (totalSheets <= 2) return true; // 4 pages = all cover
    return sheetIndex === 0 || sheetIndex === totalSheets - 1;
  }

  private getSheetFinish(sheetIndex: number, totalSheets: number): PaperFinish {
    const isCover = this.isCoverSheet(sheetIndex, totalSheets);
    if (isCover) {
      return this.settings.coverPaperFinish || this.settings.paperFinish || 'matte';
    }
    return this.settings.insidePaperFinish || this.settings.paperFinish || 'matte';
  }

  private getSheetWeight(sheetIndex: number, totalSheets: number): PaperWeight {
    const isCover = this.isCoverSheet(sheetIndex, totalSheets);
    if (isCover) {
      return this.settings.coverPaperWeight || this.settings.paperWeight || 350;
    }
    return this.settings.insidePaperWeight || this.settings.paperWeight || 120;
  }

  private async loadAllTextures() {
    for (const tex of this.textures) {
      if (tex) tex.dispose();
    }
    this.textures = [];

    const totalSheets = Math.ceil(this.pages.length / 2);

    for (let pIdx = 0; pIdx < this.pages.length; pIdx++) {
      const page = this.pages[pIdx];
      const sheetIndex = Math.floor(pIdx / 2);
      const finish = this.getSheetFinish(sheetIndex, totalSheets);

      if (page.imageUrl) {
        try {
          const tex = await loadUserTexture(page.imageUrl);
          tex.anisotropy = 16;
          this.textures.push(tex);
        } catch {
          this.textures.push(createDefaultPageTexture(page, finish));
        }
      } else {
        this.textures.push(createDefaultPageTexture(page, finish));
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

    // Ground shadow plane
    const shadowGeo = new THREE.PlaneGeometry(width * 3.8, height * 2.6);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -height / 2 - 0.01;
    this.shadowPlane.receiveShadow = true;
    this.root.add(this.shadowPlane);

    // Spine rod (reliure centrale)
    const spineRadius = Math.max(0.008, Math.min(0.024, numSheets * 0.0018));
    const spineGeo = new THREE.CylinderGeometry(spineRadius, spineRadius, height, 32);
    const spineMat = this.createPaperMaterial(0, true);
    this.spineMesh = new THREE.Mesh(spineGeo, spineMat);
    this.spineMesh.castShadow = true;
    this.spineMesh.receiveShadow = true;
    this.root.add(this.spineMesh);

    // Create sheets: realistic thickness prevents clipping through adjacent sheets
    for (let i = 0; i < numSheets; i++) {
      const isCover = this.isCoverSheet(i, numSheets);
      const leafThickness = isCover ? 0.0028 : 0.0012;
      const leaf = this.createLeaf(i, width, height, leafThickness);
      this.leaves.push(leaf);
      this.root.add(leaf.pivot);
    }
  }

  /**
   * Builds a single leaf. Pivot is along the spine.
   */
  private createLeaf(
    sheetIndex: number,
    width: number,
    height: number,
    thickness: number
  ): LeafMeshGroup {
    const pivot = new THREE.Group();
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

    const frontMat = this.createPaperMaterial(sheetIndex);
    const backMat = this.createPaperMaterial(sheetIndex);

    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;

    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;

    // Edges (top, bottom, outer edge only — 0 Z-fighting)
    const edgesGroup = new THREE.Group();
    const edgeMat = this.createPaperMaterial(sheetIndex, true);

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

  private createPaperMaterial(sheetIndex: number, isEdge: boolean = false): THREE.MeshStandardMaterial {
    const totalSheets = this.leaves.length || Math.ceil(this.settings.pageCount / 2);
    const finish = this.getSheetFinish(sheetIndex, totalSheets);

    let roughness = 0.75;
    const metalness = 0.02;

    switch (finish) {
      case 'glossy':   roughness = 0.18; break;
      case 'kraft':    roughness = 0.90; break;
      case 'textured': roughness = 0.85; break;
    }

    return new THREE.MeshStandardMaterial({
      color: finish === 'kraft' ? 0xd2b48c : 0xfcfbf9,
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
   *
   * Stacking rules (prevents all chevauchement & polygon clipping):
   * - Left stack: Sheet k-1 is the top visible page at baseLeft.
   *   All underlying sheets (i < k - 1) are rotated further back and shifted in -Z.
   * - Right stack: Sheet k is the top visible page at baseRight.
   *   All underlying sheets (i > k) are rotated further back and shifted in -Z.
   */
  public updateAngles(instant: boolean = false) {
    const numSheets = this.leaves.length;
    if (numSheets === 0) return;

    const formatDims = FORMAT_DIMENSIONS[this.settings.format] || FORMAT_DIMENSIONS.a5;
    const width = formatDims.width;
    const k = Math.min(numSheets, Math.max(0, typeof this.settings.currentSpread === 'number' ? this.settings.currentSpread : 0));
    const openDeg = Math.min(180, Math.max(0, typeof this.settings.openAngle === 'number' && !isNaN(this.settings.openAngle) ? this.settings.openAngle : 0));
    const delta = 0.004; // Angular offset between stacked pages
    const zOffset = 0.0016; // Spine Z depth separation between stacked sheets

    if (k === 0) {
      // ── SPREAD 0: CLOSED ON FRONT COVER (Page 1) ──
      const u = openDeg / 180;
      const coverLift = (u > 0) ? -u * Math.PI : 0;
      
      this.leaves[0].targetAngle = coverLift;
      this.leaves[0].pivot.position.z = 0;

      for (let i = 1; i < numSheets; i++) {
        this.leaves[i].targetAngle = i * delta;
        this.leaves[i].pivot.position.z = -i * zOffset;
      }

      // Center the closed cover in the viewport
      this.targetCenterX = (u > 0) ? -(1 - u) * (width / 2) : -width / 2;
    } else if (k === numSheets) {
      // ── SPREAD N: CLOSED ON BACK COVER (Page N) ──
      // Sheet numSheets - 1 is the back cover face
      for (let i = 0; i < numSheets; i++) {
        const stackPos = (numSheets - 1) - i;
        this.leaves[i].targetAngle = -Math.PI + (stackPos * delta);
        this.leaves[i].pivot.position.z = -stackPos * zOffset;
      }

      // Center the closed back cover in the viewport
      this.targetCenterX = width / 2;
    } else {
      // ── SPREADS 1 TO numSheets - 1 : SYMMETRIC OPEN SPREAD ──
      const u = openDeg / 180;
      const baseRight = -(1 - u) * u * Math.PI;
      const baseLeft = baseRight - (u * Math.PI);

      for (let i = 0; i < numSheets; i++) {
        const leaf = this.leaves[i];
        if (i < k) {
          // LEFT STACK
          // Sheet k - 1 is top visible page: distance from top is (k - 1 - i)
          const depthFromTop = (k - 1) - i;
          leaf.targetAngle = baseLeft - (depthFromTop * delta);
          leaf.pivot.position.z = -depthFromTop * zOffset;
        } else {
          // RIGHT STACK
          // Sheet k is top visible page: distance from top is (i - k)
          const depthFromTop = i - k;
          leaf.targetAngle = baseRight + (depthFromTop * delta);
          leaf.pivot.position.z = -depthFromTop * zOffset;
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
