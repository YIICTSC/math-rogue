import * as T from 'three';
import type { World } from './engine';
import { machineCarts, railConnections } from './machinery';
import { isRail, isTransportLane } from './machineryParts';
import { REALM_GATE, realmFloorAnchor } from './realmTerrain';

const DEVICE_VIEW_DISTANCE = 24;

export class MachineryEffects {
  private geometry = new T.BoxGeometry();
  private luminous = new T.MeshBasicMaterial({ color: 'white', toneMapped: false });
  private metal = new T.MeshStandardMaterial({ color: '#d5b08b', roughness: .55, metalness: .38 });
  private cartMaterial = new T.MeshStandardMaterial({ color: '#fff8e5', vertexColors: true, roughness: .49, metalness: .22 });
  private tracks = new T.InstancedMesh(this.geometry, this.metal, 800);
  private couplers = new T.InstancedMesh(this.geometry, this.metal, 24);
  private signals = new T.InstancedMesh(this.geometry, this.luminous, 500);
  private water = new T.InstancedMesh(this.geometry, new T.MeshBasicMaterial({
    color:'#44b6d6', transparent:true, opacity:.6, depthWrite:false,
  }), 576);
  private lava = new T.InstancedMesh(this.geometry, this.luminous, 576);
  private beams = new T.InstancedMesh(this.geometry, new T.MeshBasicMaterial({
    color: 'white', transparent: true, opacity: .33, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
  }), 32);
  private carts: T.InstancedMesh;
  private group = new T.Group();
  private world: World | null = null;
  private revision = -1;
  private location = '';
  private cartTargets: ReturnType<typeof machineCarts> = [];
  private lastCarts = new Map<string, T.Vector3>();
  private matrix = new T.Matrix4();
  private pose = new T.Object3D();

  constructor(parent: T.Object3D, cartShape: T.BufferGeometry) {
    // Geometry ownership stays with the workshop loader.
    this.carts = new T.InstancedMesh(cartShape, this.cartMaterial, 48);
    for (const child of [this.tracks, this.couplers, this.signals, this.beams, this.carts, this.water, this.lava]) {
      child.count = 0;
      child.frustumCulled = false;
      this.group.add(child);
    }
    parent.add(this.group);
  }

  private box(mesh: T.InstancedMesh, x: number, y: number, z: number, sx: number, sy: number, sz: number, color?: string) {
    if (mesh.count >= mesh.instanceMatrix.count) return;
    this.matrix.makeScale(sx, sy, sz).setPosition(x, y, z);
    if (color) mesh.setColorAt(mesh.count, new T.Color(color));
    mesh.setMatrixAt(mesh.count++, this.matrix);
  }

  private link(mesh: T.InstancedMesh, x: number, y: number, z: number, toX: number, toY: number, toZ: number, width: number, color?: string) {
    if (mesh.count >= mesh.instanceMatrix.count) return;
    const movement = new T.Vector3(toX-x, toY-y, toZ-z);
    this.pose.position.set((x+toX)/2, (y+toY)/2, (z+toZ)/2);
    this.pose.scale.set(width, width, movement.length() + .025);
    this.pose.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), movement.normalize());
    this.pose.updateMatrix();
    if (color) mesh.setColorAt(mesh.count, new T.Color(color));
    mesh.setMatrixAt(mesh.count++, this.pose.matrix);
  }

  private rebuild(w: World, focus: T.Vector3) {
    const fixedMeshes = [this.tracks, this.signals, this.beams, this.water, this.lava];
    for (const mesh of fixedMeshes) mesh.count = 0;
    const state = w.voxels?.machinery;
    for (const [key, device] of Object.entries(state?.devices ?? {})) {
      const [x, y, z] = key.split(',').map(Number);
      if (Math.abs(x-focus.x)>DEVICE_VIEW_DISTANCE || Math.abs(z-focus.z)>DEVICE_VIEW_DISTANCE) continue;
      const block = w.voxels?.edits[key];
      if (isRail(block)) {
        const neighbors = railConnections(w, { x, y, z });
        for (const next of neighbors) {
          const dx = next.x - x, dz = next.z - z;
          for (const across of [-.27, .27]) {
            this.link(this.tracks, x+.5+dz*across,y+.12,z+.5+dx*across,
              x+.5+dx*.5+dz*across,(y+next.y)/2+.12,z+.5+dz*.5+dx*across,.063);
          }
        }
      }
      if (block === 'crystal_wire') {
        const glow = device.signal ? '#ff7cab' : '#96405f';
        if (device.signal) this.box(this.signals, x+.5,y+.21,z+.5,.16,.09,.16,glow);
        for (const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]]) {
          const dy = [0,1,-1].find(v=>!!state?.devices[`${x+dx},${y+v},${z+dz}`]);
          if (dy !== undefined) this.link(this.signals,x+.5,y+.16,z+.5,x+.5+dx*.5,y+.16+dy*.5,z+.5+dz*.5,.05,glow);
        }
      }
      if ((block==='crystal_lamp'||block==='copper_lamp') && device.signal) {
        this.box(this.signals,x+.5,y+.54,z+.5,.67,.42,.67,block==='copper_lamp'?'#ffac72':'#ffcb6f');
      }
      if (isTransportLane(block) && Object.values(w.voxels?.containers?.[key]?.items ?? {}).some(Boolean)) {
        const height = block==='conveyor' ? .24 : .58;
        this.box(this.signals,x+.5,y+height,z+.5,.2,.17,.22,'#ebc593');
      }
      if (block === 'crystal_beacon' && device.tier) {
        const color=device.beamColor??'#90fff3';
        this.box(this.beams,x+.5,y+48.6,z+.5,.18,96,.18,color);
        this.box(this.signals,x+.5,y+.78,z+.5,.16,.22,.16,color);
      }
      if(block==='waygate'&&device.signal){
        const sideways=(w.voxels?.rotations?.[key]??0)%2===1;
        this.box(this.beams,x+.5,y+.48,z+.5,sideways?.035:.53,.57,sideways?.53:.035,'#72e1f1');
        this.box(this.signals,x+.5,y+.82,z+.5,.11,.07,.11,'#bdfbde');
      }
    }
    if(w.dimensionId&&Math.hypot(focus.x-REALM_GATE.x,focus.z-REALM_GATE.z)<=DEVICE_VIEW_DISTANCE){
      const {x,z}=REALM_GATE,y=realmFloorAnchor(w.dimensionId);
      this.box(this.beams,x+.5,y+.48,z+.5,.53,.57,.035,'#a2e6f4');
      this.box(this.signals,x+.5,y+.82,z+.5,.12,.08,.13,'#c1ffef');
    }
    const flows = w.voxels?.fluids?.cells ?? {};
    for (const [key, flow] of Object.entries(flows)) {
      const [x,y,z]=key.split(',').map(Number);
      if (Math.abs(x-focus.x)>DEVICE_VIEW_DISTANCE || Math.abs(z-focus.z)>DEVICE_VIEW_DISTANCE) continue;
      const above=flows[`${x},${y+1},${z}`]?.kind===flow.kind;
      const depth=above ? 1 : .26+flow.level*.085;
      if (flow.kind==='water') this.box(this.water,x+.5,y+depth/2,z+.5,.998,depth,.998);
      else this.box(this.lava,x+.5,y+depth/2,z+.5,.998,depth,.998,flow.level>3?'#ff8a3a':'#dc5828');
    }
    for (const mesh of fixedMeshes) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.cartTargets = machineCarts(w);
  }

  update(w: World, focus: T.Vector3, dt: number, reducedMotion: boolean) {
    const location = `${Math.floor(focus.x/4)},${Math.floor(focus.z/4)}`;
    if (w !== this.world || this.revision !== w.revision || location !== this.location) {
      this.world = w;
      this.revision = w.revision;
      this.location = location;
      this.rebuild(w, focus);
    }
    this.carts.count = 0;
    const seen = new Set<string>();
    for (const target of this.cartTargets) {
      if (Math.hypot(target.x-focus.x,target.z-focus.z)>DEVICE_VIEW_DISTANCE) continue;
      const id = target.id;
      seen.add(id);
      const position = this.lastCarts.get(id) || new T.Vector3(target.x+.5, target.y+.08, target.z+.5);
      this.lastCarts.set(id, position);
      const newPosition = new T.Vector3(target.x+.5,target.y+.08,target.z+.5);
      position.lerp(newPosition, reducedMotion || position.distanceTo(newPosition) > 2 ? 1 : 1-Math.exp(-11*dt));
      this.matrix.makeRotationY(-(target.direction ?? 0)*Math.PI/2).setPosition(position);
      this.carts.setMatrixAt(this.carts.count++, this.matrix);
    }
    for (const id of this.lastCarts.keys()) if (!seen.has(id)) this.lastCarts.delete(id);
    this.couplers.count=0;
    for (const cart of this.cartTargets) {
      const follower=this.lastCarts.get(cart.id), front=cart.coupledTo ? this.lastCarts.get(cart.coupledTo) : undefined;
      if (follower&&front) this.link(this.couplers,follower.x,follower.y+.18,follower.z,front.x,front.y+.18,front.z,.09);
    }
    this.couplers.instanceMatrix.needsUpdate=true;
    this.carts.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.group.removeFromParent();
    for (const mesh of [this.tracks, this.couplers, this.signals, this.beams, this.carts, this.water, this.lava]) mesh.dispose();
    this.geometry.dispose();
    this.luminous.dispose();
    this.metal.dispose();
    this.beams.material.dispose();
    this.water.material.dispose();
    this.cartMaterial.dispose();
  }
}
