import * as THREE from 'three';
import { Workshop, makeAircraft } from './aircraftModels';
import { center, surfaceHeight, type Route } from './routes';
import { aimPoint, type Flight, type FlightInput } from './simulation';

export type RouteImages = [HTMLImageElement, HTMLImageElement, HTMLImageElement];

export function makeRouteScene(canvas: HTMLCanvasElement, route: Route, images: RouteImages) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.55));
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(53, 1, 0.85, 170000);
  scene.background = new THREE.Color(0xa6c7d7);
  const textures = images.map((image) => {
    const map = new THREE.Texture(image);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    return map;
  });
  const { region, grid, from, to } = route;
  const geometry = new THREE.PlaneGeometry(
    region.width,
    region.height,
    region.cols - 1,
    region.rows - 1,
  );
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.getAttribute('position');
  for (let n = 0; n < grid.length; n++) pos.setY(n, grid[n]);
  geometry.computeVertexNormals();
  const localCenter = (p: Route['from']) => new THREE.Vector2(center(p).x, center(p).z);
  const surface = new THREE.ShaderMaterial({
    uniforms: {
      wide: { value: textures[0] },
      departure: { value: textures[1] },
      arrival: { value: textures[2] },
      a: { value: localCenter(from) },
      b: { value: localCenter(to) },
    },
    vertexShader: `varying vec2 atlasUV; varying vec2 ground; varying float relief; varying float haze;
      void main(){atlasUV=uv;ground=position.xz;relief=clamp(dot(normal,normalize(vec3(-0.45,1.0,0.25))),0.,1.);
        vec4 eye=modelViewMatrix*vec4(position,1.); haze=smoothstep(6000.,82000.,-eye.z);gl_Position=projectionMatrix*eye;}`,
    fragmentShader: `uniform sampler2D wide,departure,arrival;uniform vec2 a,b;
      varying vec2 atlasUV;varying vec2 ground;varying float relief;varying float haze;
      vec4 detail(sampler2D img,vec2 center){
        vec2 uv=(ground-center)*vec2(1.,-1.)/5200.+.5;vec2 edge=min(uv,1.-uv);
        return vec4(texture2D(img,clamp(uv,0.,1.)).rgb,smoothstep(0.,.055,min(edge.x,edge.y)));}
      void main(){vec3 terrain=texture2D(wide,atlasUV).rgb;vec4 d=detail(departure,a),e=detail(arrival,b);
        terrain=mix(mix(terrain,d.rgb,d.a),e.rgb,e.a)*(.80+.27*relief);
        gl_FragColor=vec4(mix(terrain,vec3(.38,.57,.69),haze*.91),1.);
        #include <colorspace_fragment>
      }`,
  });
  scene.add(new THREE.Mesh(geometry, surface));
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(140000, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader:
        'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec3 dir;void main(){vec3 d=normalize(dir);float glow=pow(max(0.,dot(d,normalize(vec3(-.6,.34,-.73)))),520.);
      gl_FragColor=vec4(mix(vec3(.38,.57,.69),vec3(.07,.28,.57),smoothstep(.0,.60,d.y))+vec3(1.,.84,.60)*glow,1.);
      #include <colorspace_fragment>
    }`,
    }),
  );
  scene.add(sky, new THREE.HemisphereLight(0xfff7e8, 0x92acb1, 2));
  const light = new THREE.DirectionalLight(0xffefe1, 1.9);
  light.position.set(-3, 6, -2);
  scene.add(light);
  const w = new Workshop(),
    aircraft = makeAircraft('plane', w);
  scene.add(aircraft.body);
  for (const strip of [from, to]) {
    const stripGroup = new THREE.Group();
    const c = center(strip);
    stripGroup.position.set(c.x, strip.elevation + 0.3, c.z);
    stripGroup.rotation.y = -Math.atan2(strip.ux, -strip.uz);
    scene.add(stripGroup);
    w.part(stripGroup, w.box, 0x3a4346, [0, 0, 0], [strip.width, 0.45, strip.length]);
    const paint: THREE.Matrix4[] = [];
    function stripe(x: number, z: number, width: number, length: number) {
      paint.push(new THREE.Matrix4().makeScale(width, 0.12, length).setPosition(x, 0.36, z));
    }
    for (let z = -strip.length / 2 + 45; z < strip.length / 2; z += 70) stripe(0, z, 1.5, 30);
    for (const end of [-1, 1]) {
      for (const n of [-3, -2, -1, 1, 2, 3])
        stripe(n * strip.width * 0.105, end * (strip.length / 2 - 38), strip.width * 0.063, 24);
    }
    const markings = new THREE.InstancedMesh(w.box, w.paint(0xeee9d7), paint.length);
    paint.forEach((matrix, i) => markings.setMatrixAt(i, matrix));
    stripGroup.add(markings);
  }
  const beacon = new THREE.Mesh(
    new THREE.TorusGeometry(26, 1.4, 6, 36),
    new THREE.MeshBasicMaterial({ color: 0xffbf59 }),
  );
  scene.add(beacon);
  const chase = new THREE.Vector3(),
    look = new THREE.Vector3();
  let lastW = 0,
    lastH = 0;
  return {
    draw(s: Flight, input: FlightInput, survey: boolean, dt: number) {
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      if (!width || !height) return;
      if (lastW !== width || lastH !== height) {
        lastW = width;
        lastH = height;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.fov = width < height ? 62 : 53;
        camera.updateProjectionMatrix();
      }
      aircraft.update(s, input, dt);
      const fx = Math.sin(s.heading),
        fz = -Math.cos(s.heading);
      const clearance = Math.max(0, s.y - surfaceHeight(route, s.x, s.z));
      const back = survey ? Math.min(230, 72 + clearance * 0.12) : 23;
      const lead = survey ? 115 : 28;
      chase.set(
        s.x - fx * back,
        s.y + (survey ? Math.min(135, 57 + clearance * 0.08) : 9),
        s.z - fz * back,
      );
      chase.y = Math.max(chase.y, surfaceHeight(route, chase.x, chase.z) + 3);
      // Follow the aircraft's translation immediately during accelerated cruise.
      camera.position.copy(chase);
      look.set(s.x + fx * lead, s.y + s.pitch * 12, s.z + fz * lead);
      camera.lookAt(look);
      sky.position.copy(camera.position);
      const target = aimPoint(s);
      beacon.visible = s.airborne && s.nextGate < s.lesson.gates.length;
      if (beacon.visible) {
        beacon.position.set(target.x, target.y, target.z);
        beacon.quaternion.copy(camera.quaternion);
        beacon.scale.setScalar(Math.max(1, camera.position.distanceTo(beacon.position) / 2600));
      }
      renderer.render(scene, camera);
    },
    dispose() {
      const geometrySet = new Set<THREE.BufferGeometry>([w.ball, w.pebble, w.box, w.cone, w.tube]),
        materialSet = new Set<THREE.Material>();
      scene.traverse((node) => {
        if (node instanceof THREE.InstancedMesh) node.dispose();
        if (node instanceof THREE.Mesh) {
          geometrySet.add(node.geometry);
          for (const m of Array.isArray(node.material) ? node.material : [node.material])
            materialSet.add(m);
        }
      });
      geometrySet.forEach((g) => g.dispose());
      materialSet.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      if (!canvas.isConnected) renderer.forceContextLoss();
    },
  };
}
