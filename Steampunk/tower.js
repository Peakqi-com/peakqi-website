// 蒸汽龐克建築怪獸「六業移動城砦 MK-VI」 model builder
// Every articulated part is a NAMED group with a correct pivot, so the
// exported GLB can be animated in three.js via getObjectByName().
import * as THREE from 'three';

const RS = 24; // default radial segments (15° facets → visible in line-art mode)

function M(name, color, rough, metal, extra) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, extra || {}));
  m.name = name;
  return m;
}
function makeMaterials() {
  return {
    brass: M('brass', 0xcfa964, 0.28, 0.75),
    copper: M('copper', 0xb26b45, 0.32, 0.75),
    verdigris: M('verdigris', 0x5e9486, 0.5, 0.4, { side: THREE.DoubleSide }),
    iron: M('iron', 0x4b4f58, 0.5, 0.55, { side: THREE.DoubleSide }),
    ironDark: M('iron_dark', 0x3a3f49, 0.55, 0.5, { side: THREE.DoubleSide }),
    wood: M('wood', 0x6f4a2d, 0.78, 0.05, { side: THREE.DoubleSide }),
    plaster: M('plaster', 0xe0d2b4, 0.88, 0.02, { side: THREE.DoubleSide }),
    velvet: M('velvet', 0x8a2f3c, 0.92, 0.02, { side: THREE.DoubleSide }),
    blossom: M('blossom', 0xe8a7b8, 0.85, 0.02),
    glassWarm: M('glass_warm', 0xffc98c, 0.25, 0.1, { emissive: 0xff9a3d, emissiveIntensity: 1.3 }),
    glassCool: M('glass_cool', 0xbfe3ef, 0.3, 0.1, { emissive: 0x3fa8d8, emissiveIntensity: 1.0 }),
    beam: M('beam_glow', 0xffc98c, 1, 0, { emissive: 0xffa64d, emissiveIntensity: 1.1, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
  };
}

function add(parent, geo, mat, name, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(x || 0, y || 0, z || 0);
  parent.add(m);
  return m;
}
function grp(parent, name, x, y, z) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x || 0, y || 0, z || 0);
  parent.add(g);
  return g;
}
const _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function tube(parent, mat, name, a, b, r, seg) {
  _va.set(a[0], a[1], a[2]); _vb.set(b[0], b[1], b[2]);
  const d = _vb.clone().sub(_va), len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 16), mat);
  m.name = name;
  m.position.copy(_va).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(_up, d.normalize());
  parent.add(m);
  return m;
}
function cyl(rt, rb, h, seg, open) { return new THREE.CylinderGeometry(rt, rb, h, seg || RS, 1, !!open); }
function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
function sph(r, w, h) { return new THREE.SphereGeometry(r, w || 16, h || 10); }
function torus(r, t, rs, ts, arc) { return new THREE.TorusGeometry(r, t, rs || 10, ts || 44, arc || Math.PI * 2); }

function gearGeo(rOut, teeth, depth, hole) {
  const rRoot = rOut - Math.max(0.06, rOut * 0.14);
  const s = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const pts = [[rOut, a0], [rOut, a0 + step * 0.38], [rRoot, a0 + step * 0.5], [rRoot, a0 + step * 0.88]];
    for (let k = 0; k < 4; k++) {
      const x = Math.cos(pts[k][1]) * pts[k][0], y = Math.sin(pts[k][1]) * pts[k][0];
      if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
  }
  s.closePath();
  if (hole > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, hole, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function archGeo(w, h, depth) { // rounded-top arch panel
  const s = new THREE.Shape(), hb = h - w / 2;
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, hb);
  s.absarc(0, hb, w / 2, Math.PI, 0, true);
  s.lineTo(w / 2, 0); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
function gothicGeo(w, h, depth) { // pointed-top panel
  const s = new THREE.Shape(), hb = h * 0.62;
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, hb);
  s.quadraticCurveTo(-w / 2, h * 0.9, 0, h);
  s.quadraticCurveTo(w / 2, h * 0.9, w / 2, hb);
  s.lineTo(w / 2, 0); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
function heartGeo(size, depth) {
  const s = new THREE.Shape(), x = 0, y = 0;
  s.moveTo(x + 0.25, y + 0.25);
  s.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  s.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
  s.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
  s.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
  s.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
  s.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.center();
  g.rotateZ(Math.PI); // drawn upside-down in canvas coords
  g.scale(size, size, 1);
  return g;
}
function houseGeo(w, h, depth) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h * 0.58);
  s.lineTo(0, h); s.lineTo(-w / 2, h * 0.58); s.closePath();
  const door = new THREE.Path();
  door.moveTo(-0.07 * w, 0); door.lineTo(0.07 * w, 0); door.lineTo(0.07 * w, h * 0.3); door.lineTo(-0.07 * w, h * 0.3);
  s.holes.push(door);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
function triPrism(w, h, depth) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
function lathe(pts, seg) {
  return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || RS);
}
function rivetRing(parent, mat, name, cx, cy, cz, r, count, size, horizontal) {
  const g = grp(parent, name, cx, cy, cz);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    add(g, sph(size, 8, 6), mat, name + '_' + i, Math.cos(a) * r, horizontal ? 0 : Math.sin(a) * r, horizontal ? Math.sin(a) * r : 0);
  }
  return g;
}

// ---------------------------------------------------------------- build
export function buildTower() {
  const mats = makeMaterials();
  const root = new THREE.Group();
  root.name = 'steampunk_tower';
  const anim = { gears: [], spinners: [], swayFloors: [], puffs: [], lanterns: [], clockMin: null, clockHour: null, bell: null, ring: null, iris: null, beam: null, steamGroup: null };

  // ============ 行走足 legs ============
  const legs = grp(root, 'legs');
  const LEG = [['FL', 45], ['FR', 315], ['BL', 135], ['BR', 225]];
  for (const [tag, deg] of LEG) {
    const th = (deg * Math.PI) / 180;
    const leg = grp(legs, 'leg_' + tag, Math.cos(th) * 2.5, 2.3, Math.sin(th) * 2.5);
    leg.rotation.y = -th;
    add(leg, sph(0.27, 16, 12), mats.brass, 'leg_' + tag + '_hip', 0, 0, 0);
    tube(leg, mats.iron, 'leg_' + tag + '_strut', [0, 0.08, 0], [-0.4, 0.45, 0], 0.1, 12);
    tube(leg, mats.iron, 'leg_' + tag + '_thigh', [0, 0, 0], [1.15, -0.9, 0], 0.13, 14);
    tube(leg, mats.brass, 'leg_' + tag + '_piston', [0.15, -0.32, 0.16], [0.95, -0.84, 0.13], 0.05, 10);
    const knee = grp(leg, 'leg_' + tag + '_knee', 1.15, -0.9, 0);
    add(knee, sph(0.2, 16, 12), mats.brass, 'leg_' + tag + '_kneecap', 0, 0, 0);
    tube(knee, mats.iron, 'leg_' + tag + '_shin', [0, 0, 0], [0.3, -1.16, 0], 0.095, 14);
    add(knee, cyl(0.22, 0.44, 0.28, 18), mats.ironDark, 'leg_' + tag + '_foot', 0.3, -1.26, 0);
    add(knee, torus(0.16, 0.04, 8, 24), mats.brass, 'leg_' + tag + '_ankle', 0.3, -1.1, 0).rotation.x = Math.PI / 2;
  }

  // ============ 底盤 chassis ============
  const chassis = grp(root, 'chassis');
  add(chassis, cyl(3.05, 3.3, 0.55, 8), mats.iron, 'chassis_deck', 0, 2.32, 0);
  add(chassis, cyl(3.12, 3.12, 0.1, 8), mats.brass, 'chassis_trim', 0, 2.62, 0);
  const belly = add(chassis, sph(1.7, RS, 12), mats.copper, 'chassis_belly', 0, 2.1, 0);
  belly.scale.set(1, 0.55, 1);
  rivetRing(chassis, mats.brass, 'chassis_rivets', 0, 2.45, 0, 3.19, 24, 0.05, true);
  add(chassis, cyl(0.32, 0.4, 0.5, 12), mats.ironDark, 'chassis_capstan', 2.4, 2.9, -1.6);

  // ============ 引擎室 engine ============
  const boiler = grp(root, 'engine_boiler');
  const bo = add(boiler, cyl(0.72, 0.72, 1.6, RS), mats.copper, 'boiler_body', -2.43, 3.42, 1.37);
  bo.rotation.z = Math.PI / 2; bo.rotation.y = -0.55;
  const capA = add(boiler, sph(0.72, RS, 12), mats.brass, 'boiler_cap_a', -3.11, 3.42, 1.78);
  capA.scale.set(0.55, 1, 1); capA.rotation.y = -0.55;
  const capB = add(boiler, sph(0.72, RS, 12), mats.brass, 'boiler_cap_b', -1.75, 3.42, 0.95);
  capB.scale.set(0.55, 1, 1); capB.rotation.y = -0.55;
  for (let i = 0; i < 3; i++) {
    const t = -0.55 + i * 0.55;
    const ring = add(boiler, torus(0.74, 0.035, 8, 40), mats.brass, 'boiler_band_' + i, -2.43 + 0.85 * t, 3.42, 1.37 - 0.52 * t);
    ring.rotation.y = Math.PI / 2 - 0.55;
  }
  add(boiler, cyl(0.22, 0.26, 0.34, 14), mats.brass, 'boiler_dome', -2.43, 4.28, 1.37);
  add(boiler, sph(0.1, 10, 8), mats.brass, 'boiler_valve', -2.43, 4.5, 1.37);
  const fire = add(boiler, cyl(0.3, 0.3, 0.08, 16), mats.ironDark, 'boiler_hatch', -1.72, 3.3, 0.93);
  fire.rotation.x = Math.PI / 2; fire.rotation.z = 0.9;
  tube(boiler, mats.copper, 'boiler_pipe_up', [-2.43, 4.4, 1.37], [-2.43, 5.05, 1.28], 0.06, 12);
  tube(boiler, mats.copper, 'boiler_pipe_in', [-2.43, 5.05, 1.28], [-1.75, 5.05, 0.7], 0.06, 12);
  add(boiler, sph(0.09, 10, 8), mats.copper, 'boiler_elbow', -2.43, 5.05, 1.28);

  const tanks = grp(root, 'engine_tanks');
  for (let i = 0; i < 2; i++) {
    const tx = -0.25 + i * 0.85, tz = -1.95 - i * 0.12;
    add(tanks, cyl(0.32, 0.34, 1.05, 18), mats.verdigris, 'tank_' + i, tx, 3.15, tz);
    const dome = add(tanks, sph(0.32, 18, 10), mats.verdigris, 'tank_' + i + '_dome', tx, 3.68, tz);
    dome.scale.y = 0.55;
    add(tanks, sph(0.06, 8, 6), mats.brass, 'tank_' + i + '_valve', tx, 3.9, tz);
    rivetRing(tanks, mats.brass, 'tank_' + i + '_rivets', tx, 3.0, tz, 0.345, 10, 0.028, true);
  }
  tube(tanks, mats.copper, 'tank_pipe_a', [-0.25, 3.75, -1.95], [-0.25, 4.6, -1.6], 0.055, 12);
  tube(tanks, mats.copper, 'tank_pipe_b', [-0.25, 4.6, -1.6], [-0.25, 5.6, -1.45], 0.055, 12);
  tube(tanks, mats.copper, 'tank_pipe_c', [0.6, 3.75, -2.07], [0.6, 6.2, -1.35], 0.055, 12);
  add(tanks, sph(0.08, 10, 8), mats.copper, 'tank_elbow', -0.25, 4.6, -1.6);
  add(tanks, torus(0.075, 0.02, 8, 20), mats.brass, 'tank_flange', 0.6, 5.0, -1.86).rotation.x = Math.PI / 2 - 0.28;

  const engGears = grp(root, 'engine_gears');
  const mkGear = (name, x, y, z, r, teeth, depth, speed, faceAxis) => {
    const mount = grp(engGears, name + '_mount', x, y, z);
    if (faceAxis === 'x') mount.rotation.y = Math.PI / 2;
    const g = add(mount, gearGeo(r, teeth, depth, r * 0.18), mats.brass, name, 0, 0, 0);
    anim.gears.push({ node: g, speed });
    add(mount, cyl(r * 0.16, r * 0.16, depth + 0.16, 12), mats.ironDark, name + '_axle', 0, 0, 0).rotation.x = Math.PI / 2;
    return mount;
  };
  mkGear('anim_gear_main', 0.95, 3.62, 2.35, 0.6, 14, 0.12, 0.6);
  mkGear('anim_gear_mid', 1.98, 3.82, 2.35, 0.37, 9, 0.12, -0.93);
  mkGear('anim_gear_small', 0.14, 3.4, 2.35, 0.25, 7, 0.12, -1.2);
  const towerGearMount = mkGear('anim_gear_tower', 2.02, 4.3, -0.45, 0.85, 16, 0.16, -0.16, 'x');
  towerGearMount.children[0].material = mats.copper;
  add(engGears, box(0.16, 1.0, 0.5), mats.ironDark, 'gear_bracket_a', 0.95, 3.05, 2.5);
  add(engGears, box(0.16, 1.2, 0.5), mats.ironDark, 'gear_bracket_b', 1.98, 3.2, 2.5);

  // ============ 1F 政府標案 · 補助(剖面辦公廳) ============
  const gov = grp(root, 'floor1_gov'); gov.position.set(0, 2.6, 0);
  const DR1 = Math.PI / 180;
  add(gov, new THREE.CylinderGeometry(1.95, 2.1, 2.7, 24, 1, true, 350 * DR1, 260 * DR1), mats.plaster, 'gov_wall', 0, 1.35, 0);
  add(gov, cyl(2.0, 2.0, 0.07, 32), mats.wood, 'gov_floor', 0, 0.2, 0);
  add(gov, cyl(1.9, 1.9, 0.05, 32), mats.plaster, 'gov_ceiling', 0, 2.6, 0);
  [100, 200].forEach((deg, i) => {
    const a = deg * DR1;
    add(gov, box(0.1, 2.7, 0.14), mats.brass, 'gov_jamb_' + i, Math.cos(a) * 1.98, 1.35, Math.sin(a) * 1.98).rotation.y = Math.PI / 2 - a;
  });
  // —— 辦公廳陳設 ——
  const desk = grp(gov, 'gov_desk', -0.35, 0, -0.55);
  desk.rotation.y = 0.35;
  add(desk, box(0.9, 0.06, 0.42), mats.wood, 'desk_top', 0, 0.8, 0);
  add(desk, box(0.2, 0.54, 0.36), mats.wood, 'desk_ped_a', -0.3, 0.5, 0);
  add(desk, box(0.2, 0.54, 0.36), mats.wood, 'desk_ped_b', 0.3, 0.5, 0);
  add(desk, box(0.16, 0.05, 0.22), mats.plaster, 'doc_stack_a', -0.25, 0.855, 0.02);
  add(desk, box(0.14, 0.09, 0.2), mats.plaster, 'doc_stack_b', 0.05, 0.875, -0.08);
  add(desk, box(0.13, 0.03, 0.18), mats.plaster, 'doc_stack_c', 0.28, 0.845, 0.06).rotation.y = 0.3;
  add(desk, cyl(0.028, 0.045, 0.06, 10), mats.brass, 'gov_stamp', 0.1, 0.86, 0.14);
  add(desk, sph(0.02, 8, 6), mats.brass, 'gov_stamp_knob', 0.1, 0.91, 0.14);
  add(gov, box(0.28, 0.04, 0.24), mats.wood, 'gov_chair_seat', -0.5, 0.52, -0.95);
  add(gov, box(0.28, 0.32, 0.04), mats.wood, 'gov_chair_back', -0.56, 0.68, -1.1);
  add(gov, box(0.07, 0.5, 0.07), mats.ironDark, 'gov_chair_ped', -0.5, 0.28, -0.95);
  // 公文格架
  const pigeon = grp(gov, 'gov_pigeonholes', 0.9, 0, -1.55);
  pigeon.rotation.y = -Math.PI / 6;
  add(pigeon, box(0.95, 1.35, 0.14), mats.wood, 'pigeon_body', 0, 1.0, 0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    add(pigeon, box(0.24, 0.32, 0.03), mats.ironDark, 'pigeon_' + r + c, -0.3 + c * 0.3, 0.55 + r * 0.42, 0.065);
  }
  add(pigeon, box(0.2, 0.03, 0.14), mats.plaster, 'pigeon_doc', -0.3, 0.72, 0.09).rotation.z = 0.08;
  // 保險箱(補助款)
  const safe = grp(gov, 'gov_safe', -1.3, 0, -1.05);
  safe.rotation.y = 0.89;
  add(safe, box(0.5, 0.8, 0.45), mats.ironDark, 'safe_body', 0, 0.6, 0);
  add(safe, cyl(0.06, 0.06, 0.05, 12), mats.brass, 'safe_dial', 0, 0.68, 0.24).rotation.x = Math.PI / 2;
  add(safe, box(0.12, 0.03, 0.03), mats.brass, 'safe_handle', 0, 0.5, 0.24);
  // 圖筒桶
  add(gov, cyl(0.17, 0.19, 0.5, 14), mats.wood, 'plan_barrel', 1.3, 0.45, -0.55);
  [[-0.06, 0.12, -0.18], [0.05, -0.1, 0.15], [0.02, 0.18, 0.05], [-0.03, -0.15, -0.02]].forEach((t, i) => {
    const roll = add(gov, cyl(0.028, 0.028, 0.55, 8), mats.plaster, 'plan_roll_' + i, 1.3 + t[0], 0.75, -0.55 + t[0] * 0.5);
    roll.rotation.x = t[1]; roll.rotation.z = t[2];
  });
  // 申請人長椅
  const bench = grp(gov, 'gov_bench', -1.3, 0, 0.5);
  bench.rotation.y = 0.95;
  add(bench, box(0.55, 0.05, 0.18), mats.wood, 'bench_seat', 0, 0.45, 0);
  add(bench, box(0.55, 0.22, 0.04), mats.wood, 'bench_back', 0, 0.62, -0.09);
  add(bench, box(0.05, 0.25, 0.16), mats.ironDark, 'bench_leg_a', -0.22, 0.31, 0);
  add(bench, box(0.05, 0.25, 0.16), mats.ironDark, 'bench_leg_b', 0.22, 0.31, 0);
  const glight = new THREE.PointLight(0xffb066, 2.6, 6.0, 2);
  glight.name = 'gov_light';
  glight.position.set(-0.2, 1.9, -0.3);
  gov.add(glight);
  add(gov, torus(2.03, 0.09, 10, 48), mats.brass, 'gov_cornice', 0, 2.66, 0).rotation.x = Math.PI / 2;
  add(gov, torus(2.16, 0.1, 10, 48), mats.iron, 'gov_plinth', 0, 0.1, 0).rotation.x = Math.PI / 2;
  const colAngles = [20, 65, 115, 160, 200, 250, 290, 340];
  colAngles.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180, cx = Math.cos(a) * 2.12, cz = Math.sin(a) * 2.12;
    add(gov, cyl(0.085, 0.1, 2.15, 12), mats.plaster, 'gov_col_' + i, cx, 1.25, cz);
    add(gov, box(0.24, 0.12, 0.24), mats.brass, 'gov_cap_' + i, cx, 2.4, cz);
    add(gov, box(0.26, 0.1, 0.26), mats.brass, 'gov_base_' + i, cx, 0.22, cz);
  });
  // 大時鐘(標案死線)
  const clockG = grp(gov, 'gov_clock', 0, 1.75, 2.02);
  add(clockG, cyl(0.68, 0.68, 0.09, 32), mats.plaster, 'clock_face', 0, 0, 0.02).rotation.x = Math.PI / 2;
  add(clockG, torus(0.68, 0.075, 10, 48), mats.brass, 'clock_bezel', 0, 0, 0.06);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = add(clockG, box(0.035, i % 3 === 0 ? 0.12 : 0.07, 0.02), mats.ironDark, 'clock_tick_' + i, Math.sin(a) * 0.56, Math.cos(a) * 0.56, 0.075);
    tick.rotation.z = -a;
  }
  const hMin = grp(clockG, 'clock_hand_min', 0, 0, 0.09);
  add(hMin, box(0.045, 0.6, 0.02).translate(0, 0.25, 0), mats.ironDark, 'clock_hand_min_arm', 0, 0, 0);
  const hHour = grp(clockG, 'clock_hand_hour', 0, 0, 0.11);
  add(hHour, box(0.06, 0.42, 0.02).translate(0, 0.16, 0), mats.ironDark, 'clock_hand_hour_arm', 0, 0, 0);
  hMin.rotation.z = -1.1; hHour.rotation.z = -5.6;
  anim.clockMin = hMin; anim.clockHour = hHour;
  add(clockG, sph(0.05, 10, 8), mats.brass, 'clock_pin', 0, 0, 0.12);
  // 入口門廊(45°)
  const porch = grp(gov, 'gov_porch', Math.cos(Math.PI / 4) * 2.0, 0, Math.sin(Math.PI / 4) * 2.0);
  porch.rotation.y = Math.PI / 4;
  add(porch, archGeo(0.62, 1.35, 0.1), mats.glassWarm, 'gov_door', 0, 0.06, 0.02);
  add(porch, cyl(0.06, 0.07, 1.6, 10), mats.brass, 'gov_porch_col_l', -0.5, 0.8, 0.3);
  add(porch, cyl(0.06, 0.07, 1.6, 10), mats.brass, 'gov_porch_col_r', 0.5, 0.8, 0.3);
  add(porch, box(1.3, 0.1, 0.5), mats.plaster, 'gov_porch_lintel', 0, 1.66, 0.18);
  add(porch, triPrism(1.3, 0.42, 0.5), mats.plaster, 'gov_pediment', 0, 1.72, -0.07);
  add(porch, cyl(0.16, 0.16, 0.05, 20), mats.brass, 'gov_seal', 0, 1.95, 0.45).rotation.x = Math.PI / 2;
  // 拱窗×2(避開剖面開口)
  [250, 320].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const w = add(gov, archGeo(0.4, 0.95, 0.07), mats.glassWarm, 'gov_win_' + i, Math.cos(a) * 1.99, 0.9, Math.sin(a) * 1.99);
    w.rotation.y = -a + Math.PI / 2;
  });
  anim.swayFloors.push(gov);

  // ============ 2F 影像製作 · 劇本(剖面試片室) ============
  const film = grp(root, 'floor2_film'); film.position.set(0.45, 5.3, 0); film.rotation.y = 0.14;
  add(film, box(3.0, 0.06, 2.4), mats.wood, 'film_floor', 0, 0.17, 0);
  add(film, box(3.1, 2.14, 0.09), mats.wood, 'film_wall_back', 0, 1.1, -1.205);
  add(film, box(0.09, 2.14, 2.5), mats.wood, 'film_wall_l', -1.505, 1.1, 0);
  add(film, box(0.09, 2.14, 2.5), mats.wood, 'film_wall_r', 1.505, 1.1, 0);
  add(film, box(2.9, 0.05, 2.3), mats.plaster, 'film_ceiling', 0, 2.16, 0);
  add(film, box(3.1, 0.42, 0.08), mats.wood, 'film_header', 0, 1.96, 1.21);
  add(film, box(3.32, 0.14, 2.72), mats.iron, 'film_roof', 0, 2.27, 0);
  add(film, box(3.26, 0.12, 2.66), mats.iron, 'film_sill', 0, 0.06, 0);
  [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]].forEach((p, i) => {
    add(film, box(0.14, 2.2, 0.14), mats.brass, 'film_post_' + i, p[0], 1.1, p[1]);
  });
  const bkt = add(film, triPrism(0.7, 0.55, 0.4), mats.iron, 'film_bracket_a', -1.3, -0.62, 0.6);
  bkt.rotation.z = Math.PI; bkt.rotation.y = Math.PI / 2;
  const bkt2 = add(film, triPrism(0.7, 0.55, 0.4), mats.iron, 'film_bracket_b', -1.3, -0.62, -0.6);
  bkt2.rotation.z = Math.PI; bkt2.rotation.y = Math.PI / 2;
  // 後窗×3 + 劇本卷軸招牌
  for (let i = 0; i < 3; i++) add(film, box(0.5, 0.62, 0.06), mats.glassWarm, 'film_win_' + i, -0.9 + i * 0.9, 1.28, -1.26);
  // —— 試片室陳設 ——
  const fscreen = grp(film, 'film_screen', -1.44, 1.25, -0.15);
  fscreen.rotation.y = Math.PI / 2;
  add(fscreen, box(0.78, 0.52, 0.015), mats.brass, 'screen_frame', 0, 0, -0.01);
  add(fscreen, box(0.7, 0.44, 0.02), mats.plaster, 'screen_canvas', 0, 0, 0);
  [-0.6, -0.1, 0.4].forEach((zz, i) => {
    add(film, box(0.14, 0.03, 0.12), mats.wood, 'cinema_chair_seat_' + i, -0.55, 0.3, zz);
    add(film, box(0.025, 0.19, 0.12), mats.wood, 'cinema_chair_back_' + i, -0.47, 0.4, zz);
    add(film, box(0.03, 0.16, 0.03), mats.ironDark, 'cinema_chair_leg_' + i, -0.55, 0.22, zz);
  });
  // 編劇桌 + 打字機
  add(film, box(0.6, 0.035, 0.3), mats.wood, 'writer_desk', 0.85, 0.56, -0.75);
  add(film, box(0.04, 0.4, 0.04), mats.ironDark, 'writer_desk_leg_a', 0.6, 0.36, -0.75);
  add(film, box(0.04, 0.4, 0.04), mats.ironDark, 'writer_desk_leg_b', 1.1, 0.36, -0.75);
  add(film, box(0.17, 0.09, 0.13), mats.ironDark, 'typewriter_body', 0.78, 0.625, -0.78);
  add(film, box(0.2, 0.02, 0.035), mats.brass, 'typewriter_carriage', 0.78, 0.68, -0.83);
  for (let i = 0; i < 5; i++) add(film, sph(0.011, 6, 5), mats.brass, 'typewriter_key_' + i, 0.71 + i * 0.035, 0.675, -0.72);
  const wpaper = add(film, box(0.11, 0.15, 0.005), mats.plaster, 'typewriter_paper', 0.78, 0.73, -0.84);
  wpaper.rotation.x = -0.3;
  add(film, cyl(0.06, 0.065, 0.26, 10), mats.wood, 'writer_stool', 0.85, 0.29, -0.45);
  // 劇本疊 + 膠卷罐
  add(film, box(0.17, 0.035, 0.23), mats.plaster, 'script_a', 1.25, 0.165, -0.3).rotation.y = 0.2;
  add(film, box(0.16, 0.035, 0.22), mats.plaster, 'script_b', 1.24, 0.2, -0.31).rotation.y = -0.15;
  add(film, box(0.15, 0.03, 0.21), mats.plaster, 'script_c', 1.26, 0.233, -0.29).rotation.y = 0.45;
  add(film, cyl(0.16, 0.16, 0.05, 18), mats.iron, 'canister_a', -1.2, 0.185, -0.9);
  add(film, cyl(0.16, 0.16, 0.05, 18), mats.iron, 'canister_b', -1.2, 0.24, -0.9).rotation.y = 0.5;
  const canC = add(film, cyl(0.16, 0.16, 0.05, 18), mats.iron, 'canister_c', -1.0, 0.22, -0.62);
  canC.rotation.x = 0.35; canC.rotation.z = 0.2;
  // 踩過的坑(補丁鋼板 + 工作靴) — 對應「出身」
  const kang = grp(film, 'pit_patch', -0.55, 0.2, 0.62);
  add(kang, cyl(0.16, 0.19, 0.014, 14), mats.ironDark, 'pit_recess', 0, -0.002, 0);
  const patchA = add(kang, box(0.22, 0.012, 0.18), mats.iron, 'pit_plate_a', 0.09, 0.012, -0.06);
  patchA.rotation.y = 0.4;
  const patchB = add(kang, box(0.13, 0.01, 0.1), mats.brass, 'pit_plate_b', -0.1, 0.009, 0.09);
  patchB.rotation.y = -0.3;
  [[0.16, -0.12], [0.02, 0.0], [0.17, 0.01], [-0.15, 0.15], [-0.04, 0.12]].forEach((p, i) => {
    add(kang, sph(0.013, 8, 6), mats.brass, 'pit_rivet_' + i, p[0], 0.02, p[1]);
  });
  const boot = grp(kang, 'pit_boot', 0.05, 0, 0.21);
  boot.rotation.y = -2.35;
  add(boot, box(0.085, 0.014, 0.2), mats.ironDark, 'boot_sole', 0, 0.007, 0);
  add(boot, box(0.08, 0.075, 0.11), mats.wood, 'boot_heel', 0, 0.052, -0.04);
  add(boot, box(0.078, 0.045, 0.08), mats.wood, 'boot_toe', 0, 0.037, 0.05);
  add(boot, cyl(0.042, 0.048, 0.07, 10), mats.wood, 'boot_shaft', 0, 0.125, -0.045);
  // 客製開發藍圖桌(雙邊平台模型) — 對應「分工」
  const bpt = grp(film, 'custom_blueprint_table', 0.62, 0.17, 0.62);
  bpt.rotation.y = -0.75;
  add(bpt, box(0.5, 0.03, 0.34), mats.wood, 'bpt_top', 0, 0.44, 0);
  [[-0.21, 0.13], [0.21, 0.13], [-0.21, -0.13], [0.21, -0.13]].forEach((p, i) => {
    add(bpt, box(0.035, 0.42, 0.035), mats.ironDark, 'bpt_leg_' + i, p[0], 0.21, p[1]);
  });
  add(bpt, box(0.34, 0.008, 0.24), mats.glassCool, 'bpt_blueprint', -0.03, 0.462, 0.01);
  add(bpt, cyl(0.022, 0.022, 0.2, 10), mats.plaster, 'bpt_roll_a', 0.19, 0.478, 0.09).rotation.z = Math.PI / 2;
  add(bpt, cyl(0.02, 0.02, 0.16, 10), mats.plaster, 'bpt_roll_b', 0.18, 0.516, 0.04).rotation.z = Math.PI / 2;
  add(bpt, box(0.05, 0.1, 0.05), mats.copper, 'bpt_tower_a', -0.14, 0.52, -0.06);
  add(bpt, box(0.05, 0.14, 0.05), mats.copper, 'bpt_tower_b', -0.01, 0.54, -0.06);
  const bpb = add(bpt, box(0.1, 0.012, 0.028), mats.brass, 'bpt_bridge', -0.075, 0.585, -0.06);
  bpb.rotation.z = 0.3;
  // 接案三原則掉牌 — 對應「紀律」
  const rules = grp(film, 'rules_board', -1.0, 1.3, -1.147);
  add(rules, box(0.44, 0.56, 0.025), mats.ironDark, 'rules_panel', 0, 0, 0);
  add(rules, box(0.46, 0.05, 0.03), mats.wood, 'rules_panel_cap', 0, 0.295, 0);
  add(rules, box(0.46, 0.05, 0.03), mats.wood, 'rules_panel_base', 0, -0.295, 0);
  add(rules, box(0.3, 0.07, 0.014), mats.brass, 'rules_bar_1', 0.04, 0.17, 0.021);
  add(rules, box(0.24, 0.07, 0.014), mats.brass, 'rules_bar_2', 0.01, 0.0, 0.021);
  add(rules, box(0.27, 0.07, 0.014), mats.brass, 'rules_bar_3', 0.025, -0.17, 0.021);
  [0.17, 0, -0.17].forEach((yy, i) => {
    add(rules, sph(0.02, 8, 6), mats.copper, 'rules_pin_' + i, -0.148, yy, 0.03);
  });
  // 自己拍：攝影機三腳架 — 對應「武器」
  const cam2f = grp(film, 'content_camera', 1.28, 0.2, -0.32);
  cam2f.rotation.y = -0.55;
  tube(cam2f, mats.ironDark, 'camtripod_leg_a', [0, 0.34, 0], [-0.14, 0, 0.1], 0.012, 8);
  tube(cam2f, mats.ironDark, 'camtripod_leg_b', [0, 0.34, 0], [0.14, 0, 0.1], 0.012, 8);
  tube(cam2f, mats.ironDark, 'camtripod_leg_c', [0, 0.34, 0], [0, 0, -0.16], 0.012, 8);
  add(cam2f, box(0.15, 0.1, 0.09), mats.iron, 'camera_body', 0, 0.42, 0);
  add(cam2f, cyl(0.032, 0.042, 0.08, 12), mats.brass, 'camera_lens', 0, 0.42, -0.085).rotation.x = Math.PI / 2;
  add(cam2f, cyl(0.05, 0.05, 0.018, 14), mats.ironDark, 'camera_reel_a', -0.035, 0.51, 0.01).rotation.z = Math.PI / 2;
  add(cam2f, cyl(0.05, 0.05, 0.018, 14), mats.ironDark, 'camera_reel_b', 0.045, 0.51, 0.01).rotation.z = Math.PI / 2;
  add(cam2f, sph(0.02, 8, 6), mats.wood, 'camera_crank', 0.095, 0.42, 0.055);
  // 自己剪：膠卷條 + 剪刀(寫字桌上)
  add(film, box(0.26, 0.004, 0.045), mats.velvet, 'edit_filmstrip', 0.98, 0.583, -0.6).rotation.y = 0.5;
  add(film, box(0.11, 0.004, 0.014), mats.brass, 'edit_scissor_a', 0.9, 0.5865, -0.52).rotation.y = 0.35;
  add(film, box(0.11, 0.004, 0.014), mats.brass, 'edit_scissor_b', 0.9, 0.5895, -0.52).rotation.y = -0.35;
  add(film, sph(0.009, 8, 6), mats.ironDark, 'edit_scissor_pin', 0.9, 0.592, -0.52);
  // 海報
  add(film, box(0.34, 0.46, 0.012), mats.brass, 'poster_frame', -0.35, 1.3, -1.15);
  add(film, box(0.3, 0.42, 0.014), mats.velvet, 'poster_art', -0.35, 1.3, -1.148);
  const fmlight = new THREE.PointLight(0xffb066, 2.8, 5.0, 2);
  fmlight.name = 'film_light';
  fmlight.position.set(0, 1.6, 0);
  film.add(fmlight);
  const scroll = add(film, cyl(0.09, 0.09, 0.78, 14), mats.plaster, 'film_scroll', 0, 2.0, 1.32);
  scroll.rotation.z = Math.PI / 2;
  add(film, cyl(0.12, 0.12, 0.08, 12), mats.brass, 'film_scroll_cap_l', -0.43, 2.0, 1.32).rotation.z = Math.PI / 2;
  add(film, cyl(0.12, 0.12, 0.08, 12), mats.brass, 'film_scroll_cap_r', 0.43, 2.0, 1.32).rotation.z = Math.PI / 2;
  // 放映機砲塔(右牆)
  const proj = grp(film, 'anim_projector', 1.62, 1.35, 0.35);
  add(proj, box(0.5, 0.34, 0.5), mats.ironDark, 'proj_mount', -0.1, -0.3, 0);
  const projBody = add(proj, cyl(0.28, 0.28, 0.85, 20), mats.iron, 'proj_body', 0.15, 0, 0);
  projBody.rotation.z = Math.PI / 2;
  add(proj, cyl(0.2, 0.3, 0.3, 20), mats.brass, 'proj_lens_ring', 0.72, 0, 0).rotation.z = Math.PI / 2;
  add(proj, cyl(0.17, 0.17, 0.06, 18), mats.glassCool, 'proj_lens', 0.9, 0, 0).rotation.z = Math.PI / 2;
  const reelA = grp(proj, 'anim_reel_a', 0.0, 0.52, 0.14);
  add(reelA, cyl(0.3, 0.3, 0.07, 22), mats.ironDark, 'reel_a_disc', 0, 0, 0).rotation.x = Math.PI / 2;
  add(reelA, cyl(0.08, 0.08, 0.12, 10), mats.brass, 'reel_a_hub', 0, 0, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    add(reelA, sph(0.045, 8, 6), mats.brass, 'reel_a_knob_' + i, Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0.05);
  }
  const reelB = grp(proj, 'anim_reel_b', -0.42, 0.44, 0.14);
  add(reelB, cyl(0.24, 0.24, 0.07, 20), mats.ironDark, 'reel_b_disc', 0, 0, 0).rotation.x = Math.PI / 2;
  add(reelB, cyl(0.07, 0.07, 0.12, 10), mats.brass, 'reel_b_hub', 0, 0, 0).rotation.x = Math.PI / 2;
  anim.spinners.push({ node: reelA, axis: 'z', speed: 1.5 }, { node: reelB, axis: 'z', speed: -1.9 });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 24, 1, true), mats.beam);
  beam.name = 'projector_beam';
  beam.position.set(2.1, -0.22, 0.35); beam.rotation.z = -Math.PI / 2 - 0.28;
  beam.userData.noWire = true; beam.userData.noShadow = true;
  film.add(beam);
  anim.beam = beam;
  // 牆上大膠卷
  const wallReel = grp(film, 'anim_reel_wall', -1.62, 1.35, -0.3);
  wallReel.rotation.y = Math.PI / 2;
  add(wallReel, torus(0.5, 0.05, 8, 36), mats.brass, 'wall_reel_rim', 0, 0, 0);
  add(wallReel, cyl(0.13, 0.13, 0.1, 14), mats.brass, 'wall_reel_hub', 0, 0, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const sp = add(wallReel, box(0.05, 0.42, 0.04), mats.brass, 'wall_reel_spoke_' + i, Math.cos(a + Math.PI / 2) * -0.23 * 0, 0, 0);
    sp.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0);
    sp.rotation.z = a + Math.PI / 2;
  }
  anim.spinners.push({ node: wallReel, axis: 'z', speed: 0.45 });
  // 場記板
  const clap = grp(film, 'film_clapper', -1.0, 2.4, 0.9);
  clap.rotation.y = 0.4;
  add(clap, box(0.5, 0.3, 0.05), mats.ironDark, 'clapper_board', 0, 0, 0);
  const clapTop = add(clap, box(0.5, 0.09, 0.05), mats.plaster, 'clapper_stick', -0.05, 0.22, 0);
  clapTop.rotation.z = 0.35;
  anim.swayFloors.push(film);

  // ============ 3F 殯葬 · AI 影片(剖面雙間) ============
  const fun = grp(root, 'floor3_funeral_ai'); fun.position.set(-0.3, 7.66, 0);
  const DR3 = Math.PI / 180;
  // 六角牆，開口朝前右(拆掉一面)
  add(fun, new THREE.CylinderGeometry(1.55, 1.62, 2.1, 5, 1, true, 60 * DR3, 300 * DR3), mats.iron, 'funeral_hex', 0, 1.05, 0);
  add(fun, cyl(1.78, 1.86, 0.12, 6), mats.iron, 'funeral_base', 0, 0.06, 0);
  add(fun, cyl(1.7, 1.78, 0.1, 6), mats.brass, 'funeral_cornice', 0, 2.12, 0);
  add(fun, cyl(1.5, 1.5, 0.08, 6), mats.wood, 'funeral_floor', 0, 0.18, 0);
  add(fun, cyl(1.46, 1.46, 0.05, 6), mats.ironDark, 'funeral_ceiling', 0, 2.04, 0);
  // 剖面門柱
  [[0, 1.5], [Math.sin(60 * DR3) * 1.5, Math.cos(60 * DR3) * 1.5]].forEach((p, i) => {
    add(fun, box(0.08, 2.1, 0.1), mats.brass, 'funeral_jamb_' + i, p[0], 1.05, p[1]).rotation.y = i ? -60 * DR3 : 0;
  });
  // 怪獸之眼(移到前左面)
  const eye = grp(fun, 'monster_eye', -0.67, 1.15, 1.16);
  eye.rotation.y = -Math.PI / 6;
  add(eye, torus(0.5, 0.09, 12, 40), mats.brass, 'eye_bezel', 0, 0, 0.04);
  add(eye, cyl(0.46, 0.46, 0.06, 28), mats.glassCool, 'eye_glass', 0, 0, 0.02).rotation.x = Math.PI / 2;
  const iris = grp(eye, 'anim_eye_iris', 0, 0, 0.07);
  add(iris, cyl(0.21, 0.21, 0.05, 20), mats.ironDark, 'eye_iris', 0, 0, 0).rotation.x = Math.PI / 2;
  add(iris, cyl(0.09, 0.09, 0.06, 14), mats.glassWarm, 'eye_pupil', 0, 0, 0.01).rotation.x = Math.PI / 2;
  anim.iris = iris;
  const eyeRivets = rivetRing(fun, mats.brass, 'eye_rivets', -0.71, 1.15, 1.23, 0.58, 12, 0.03);
  eyeRivets.rotation.y = -Math.PI / 6;
  // 尖拱窗(兩側面)
  [[1.4, 0, Math.PI / 2], [-1.4, 0, -Math.PI / 2]].forEach((p, i) => {
    const w = add(fun, gothicGeo(0.3, 0.72, 0.07), mats.glassCool, 'funeral_win_' + i, p[0], 0.55, p[1]);
    w.rotation.y = p[2];
  });
  // —— 左：追思祭壇 ——
  add(fun, box(0.42, 0.4, 0.18), mats.ironDark, 'altar_pedestal', -0.55, 0.4, -0.72).rotation.y = 0.5;
  add(fun, box(0.52, 0.06, 0.24), mats.iron, 'altar_top', -0.55, 0.63, -0.72).rotation.y = 0.5;
  [[-0.72, -0.62], [-0.55, -0.86], [-0.38, -0.6]].forEach((p, i) => {
    add(fun, cyl(0.012, 0.012, 0.07, 8), mats.plaster, 'altar_candle_' + i, p[0], 0.7, p[1]);
    add(fun, sph(0.016, 8, 6), mats.glassWarm, 'altar_flame_' + i, p[0], 0.75, p[1]);
  });
  add(fun, sph(0.032, 10, 8), mats.brass, 'lotus_core', -0.55, 0.68, -0.72);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pt = add(fun, new THREE.ConeGeometry(0.022, 0.06, 6), mats.blossom, 'lotus_p_' + i, -0.55 + Math.cos(a) * 0.045, 0.675, -0.72 + Math.sin(a) * 0.045);
    pt.scale.z = 0.5;
    pt.rotation.z = Math.cos(a) * 0.7; pt.rotation.x = -Math.sin(a) * 0.7;
  }
  const portrait = grp(fun, 'altar_portrait', -0.88, 0.98, -1.05);
  portrait.rotation.y = 0.5; portrait.rotation.x = -0.08;
  add(portrait, box(0.16, 0.2, 0.02), mats.brass, 'portrait_frame', 0, 0, 0);
  add(portrait, box(0.12, 0.16, 0.018), mats.plaster, 'portrait_photo', 0, 0, 0.005);
  // —— 右：AI 影片工作站 ——
  const aidesk = grp(fun, 'ai_desk', 0.7, 0, -0.2);
  aidesk.rotation.y = -0.5;
  add(aidesk, box(0.44, 0.03, 0.22), mats.wood, 'ai_desk_top', 0, 0.52, 0);
  add(aidesk, box(0.035, 0.36, 0.035), mats.ironDark, 'ai_desk_leg_a', -0.18, 0.34, 0);
  add(aidesk, box(0.035, 0.36, 0.035), mats.ironDark, 'ai_desk_leg_b', 0.18, 0.34, 0);
  const aimon = add(aidesk, box(0.24, 0.16, 0.02), mats.glassCool, 'ai_monitor', 0, 0.66, -0.06);
  aimon.rotation.x = -0.12;
  add(aidesk, box(0.16, 0.015, 0.07), mats.ironDark, 'ai_keyboard', 0, 0.545, 0.05);
  const rack = grp(fun, 'ai_server', 0.42, 0, -0.95);
  rack.rotation.y = 0.25;
  add(rack, box(0.2, 0.66, 0.2), mats.ironDark, 'ai_rack', 0, 0.49, 0);
  for (let i = 0; i < 6; i++) {
    add(rack, sph(0.013, 6, 5), mats.glassCool, 'ai_rack_led_' + i, -0.05 + (i % 2) * 0.1, 0.28 + Math.floor(i / 2) * 0.16, 0.105);
  }
  add(rack, box(0.16, 0.02, 0.16), mats.brass, 'ai_rack_vent', 0, 0.83, 0);
  const flight = new THREE.PointLight(0x7fc4de, 3.2, 5.0, 2);
  flight.name = 'funeral_ai_light';
  flight.position.set(0.2, 1.5, -0.1);
  fun.add(flight);
  // 鐘塔 + 吊鐘
  const cupola = grp(fun, 'funeral_cupola', -0.95, 2.18, -0.55);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    add(cupola, cyl(0.035, 0.045, 0.62, 8), mats.brass, 'cupola_col_' + i, Math.cos(a) * 0.3, 0.31, Math.sin(a) * 0.3);
  }
  add(cupola, cyl(0.02, 0.44, 0.36, 6), mats.verdigris, 'cupola_roof', 0, 0.8, 0);
  add(cupola, sph(0.05, 8, 6), mats.brass, 'cupola_finial', 0, 1.02, 0);
  const swing = grp(cupola, 'bell_swing', 0, 0.6, 0);
  add(swing, lathe([[0.001, 0], [0.1, 0.005], [0.14, 0.04], [0.155, 0.12], [0.14, 0.24], [0.1, 0.32], [0.05, 0.36], [0.001, 0.37]], 20), mats.brass, 'bell', 0, -0.42, 0);
  tube(swing, mats.ironDark, 'bell_clapper_rod', [0, -0.2, 0], [0, -0.44, 0], 0.015, 8);
  add(swing, sph(0.035, 8, 6), mats.ironDark, 'bell_clapper', 0, -0.45, 0);
  anim.bell = swing;
  // 蓮花瓣環繞鐘塔基座
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const petal = add(fun, new THREE.ConeGeometry(0.085, 0.3, 8), mats.brass, 'lotus_petal_' + i, -0.95 + Math.cos(a) * 0.34, 2.22, -0.55 + Math.sin(a) * 0.34);
    petal.scale.z = 0.45;
    petal.rotation.x = Math.cos(a) * 0; petal.rotation.z = Math.cos(a) * 0.9; petal.rotation.x = -Math.sin(a) * 0.9;
  }
  // AI 訊號桅杆
  tube(fun, mats.iron, 'ai_mast', [-1.25, 2.15, 0.55], [-1.25, 2.95, 0.55], 0.03, 8);
  add(fun, sph(0.11, 14, 10), mats.glassCool, 'ai_orb', -1.25, 3.05, 0.55);
  add(fun, torus(0.17, 0.014, 6, 24), mats.brass, 'ai_orb_ring', -1.25, 3.05, 0.55).rotation.x = 1.1;
  // 額度櫃(包月方案：圖片罐 S/M/L + 影片捲盤) — 對應「額度」
  const quota = grp(fun, 'ai_quota_shelf', 0.95, 0.22, 0.28);
  quota.rotation.y = -0.9;
  add(quota, box(0.56, 0.04, 0.26), mats.wood, 'quota_table', 0, 0.3, 0);
  [[-0.24, 0.09], [0.24, 0.09], [-0.24, -0.09], [0.24, -0.09]].forEach((p, i) => {
    add(quota, box(0.04, 0.3, 0.04), mats.ironDark, 'quota_leg_' + i, p[0], 0.15, p[1]);
  });
  add(quota, cyl(0.05, 0.055, 0.1, 12), mats.copper, 'quota_jar_s', -0.18, 0.372, 0.03);
  add(quota, cyl(0.052, 0.05, 0.018, 12), mats.brass, 'quota_lid_s', -0.18, 0.431, 0.03);
  add(quota, cyl(0.065, 0.07, 0.15, 12), mats.copper, 'quota_jar_m', -0.01, 0.397, 0.03);
  add(quota, cyl(0.067, 0.065, 0.018, 12), mats.brass, 'quota_lid_m', -0.01, 0.481, 0.03);
  add(quota, cyl(0.08, 0.086, 0.21, 12), mats.copper, 'quota_jar_l', 0.18, 0.427, 0.03);
  add(quota, cyl(0.082, 0.08, 0.018, 12), mats.brass, 'quota_lid_l', 0.18, 0.541, 0.03);
  const qreelA = add(quota, cyl(0.09, 0.09, 0.026, 16), mats.ironDark, 'quota_reel_a', -0.14, 0.412, -0.085);
  qreelA.rotation.x = Math.PI / 2 + 0.18;
  add(quota, cyl(0.03, 0.03, 0.034, 10), mats.brass, 'quota_reel_a_hub', -0.14, 0.412, -0.088).rotation.x = Math.PI / 2 + 0.18;
  const qreelB = add(quota, cyl(0.12, 0.12, 0.026, 16), mats.ironDark, 'quota_reel_b', 0.08, 0.442, -0.1);
  qreelB.rotation.x = Math.PI / 2 + 0.18;
  add(quota, cyl(0.038, 0.038, 0.034, 10), mats.brass, 'quota_reel_b_hub', 0.08, 0.442, -0.103).rotation.x = Math.PI / 2 + 0.18;
  // 加購投幣機 — 對應「彈性」
  const topup = grp(fun, 'ai_topup_machine', -0.95, 0.22, -0.3);
  topup.rotation.y = 0.6;
  add(topup, box(0.3, 0.62, 0.24), mats.copper, 'topup_body', 0, 0.31, 0);
  add(topup, box(0.33, 0.05, 0.27), mats.brass, 'topup_cap', 0, 0.618, 0);
  add(topup, box(0.09, 0.016, 0.025), mats.ironDark, 'topup_slot', -0.05, 0.5, 0.125);
  add(topup, cyl(0.05, 0.05, 0.025, 16), mats.brass, 'topup_dial', 0.08, 0.44, 0.122).rotation.x = Math.PI / 2;
  add(topup, cyl(0.012, 0.012, 0.05, 8), mats.ironDark, 'topup_needle', 0.08, 0.465, 0.128).rotation.z = 0.6;
  add(topup, box(0.13, 0.045, 0.03), mats.ironDark, 'topup_tray', -0.05, 0.22, 0.128);
  tube(topup, mats.ironDark, 'topup_crank', [0.16, 0.36, 0], [0.22, 0.42, 0.05], 0.013, 8);
  add(topup, sph(0.026, 8, 6), mats.wood, 'topup_crank_knob', 0.225, 0.425, 0.055);
  const coinG = grp(topup, 'anim_topup_coin', -0.05, 0.74, 0.06);
  add(coinG, cyl(0.04, 0.04, 0.009, 16), mats.brass, 'topup_coin', 0, 0, 0).rotation.x = Math.PI / 2;
  // 資料飛輪 — 對應「飛輪」(伺服器旁，越用越準)
  const flyM = grp(fun, 'anim_flywheel_mount', 0.02, 0.62, -0.62);
  flyM.rotation.y = 0.85;
  const fw = add(flyM, gearGeo(0.2, 12, 0.05, 0.04), mats.brass, 'anim_flywheel', 0, 0, 0);
  anim.gears.push({ node: fw, speed: 1.6 });
  add(flyM, cyl(0.032, 0.032, 0.1, 10), mats.ironDark, 'flywheel_axle', 0, 0, 0).rotation.x = Math.PI / 2;
  add(fun, box(0.035, 0.4, 0.035), mats.ironDark, 'flywheel_pillar', 0.02, 0.42, -0.665);
  anim.swayFloors.push(fun);

  // ============ 4F 房仲業務系統(剖面辦公室) ============
  const est = grp(root, 'floor4_realestate'); est.position.set(0.4, 9.9, 0.15); est.rotation.y = -0.1;
  add(est, box(2.7, 0.07, 2.1), mats.wood, 'estate_floor', 0, 0.14, 0);
  add(est, box(2.7, 1.82, 0.09), mats.plaster, 'estate_wall_back', 0, 0.93, -1.005);
  add(est, box(0.09, 1.76, 2.1), mats.plaster, 'estate_wall_l', -1.305, 0.9, 0);
  add(est, box(0.09, 1.76, 2.1), mats.plaster, 'estate_wall_r', 1.305, 0.9, 0);
  add(est, box(2.44, 0.34, 0.07), mats.plaster, 'estate_header', 0, 1.6, 1.02);
  add(est, box(2.44, 0.05, 0.08), mats.brass, 'estate_threshold', 0, 0.16, 1.03);
  add(est, box(2.52, 0.04, 1.92), mats.plaster, 'estate_ceiling', 0, 1.75, 0);
  add(est, box(2.9, 0.12, 2.3), mats.iron, 'estate_roof', 0, 1.86, 0);
  add(est, box(2.84, 0.08, 2.24), mats.iron, 'estate_sill', 0, 0.04, 0);
  [[-1.33, -1.03], [1.33, -1.03], [-1.33, 1.03], [1.33, 1.03]].forEach((p, i) => {
    add(est, box(0.12, 1.8, 0.12), mats.copper, 'estate_post_' + i, p[0], 0.9, p[1]);
  });
  // 螢幕牆(業務系統)——六面螢幕各有介面內容
  const SUI = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const sx = -0.72 + c * 0.72, sy = 0.68 + r * 0.54;
    add(est, box(0.56, 0.4, 0.05), mats.glassCool, 'estate_screen_' + r + c, sx, sy, -0.94);
    add(est, box(0.5, 0.34, 0.01), mats.ironDark, 'estate_screenbg_' + r + c, sx, sy, -0.905);
    SUI.push(grp(est, 'estate_screenui_' + r + c, sx, sy, -0.898));
  }
  // S0 折線圖+脈動點
  [[-0.18, -0.08, -0.06, 0.02], [-0.06, 0.02, 0.06, -0.03], [0.06, -0.03, 0.18, 0.09]].forEach((s, i) => {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    const seg = add(SUI[0], box(Math.hypot(dx, dy), 0.014, 0.01), mats.verdigris, 'sui0_seg_' + i, (s[0] + s[2]) / 2, (s[1] + s[3]) / 2, 0);
    seg.rotation.z = Math.atan2(dy, dx);
  });
  add(SUI[0], sph(0.02, 10, 8), mats.brass, 'sui0_dot', 0.18, 0.09, 0.008);
  add(SUI[0], box(0.4, 0.008, 0.008), mats.iron, 'sui0_axis', 0, -0.13, 0);
  // S1 客戶資料卡
  add(SUI[1], cyl(0.05, 0.05, 0.012, 16), mats.blossom, 'sui1_avatar', -0.16, 0.06, 0).rotation.x = Math.PI / 2;
  add(SUI[1], box(0.24, 0.026, 0.01).translate(0.12, 0, 0), mats.plaster, 'sui1_line_a', -0.06, 0.09, 0);
  add(SUI[1], box(0.18, 0.026, 0.01).translate(0.09, 0, 0), mats.plaster, 'sui1_line_b', -0.06, 0.03, 0);
  add(SUI[1], box(0.34, 0.03, 0.01), mats.iron, 'sui1_line_c', 0, -0.08, 0);
  add(SUI[1], box(0.09, 0.03, 0.012), mats.verdigris, 'sui1_tag', 0.15, -0.08, 0.004);
  // S2 長條圖(從基線長高)
  [0, 1, 2].forEach(i => {
    add(SUI[2], box(0.07, 0.14, 0.012).translate(0, 0.07, 0), [mats.brass, mats.copper, mats.blossom][i], 'sui2_bar_' + i, -0.11 + i * 0.11, -0.12, 0);
  });
  add(SUI[2], box(0.4, 0.008, 0.008), mats.iron, 'sui2_axis', 0, -0.125, 0);
  // S3 儀表板
  add(SUI[3], torus(0.1, 0.012, 8, 24, Math.PI), mats.plaster, 'sui3_ring', -0.08, -0.04, 0);
  const ndl = add(SUI[3], box(0.012, 0.1, 0.01).translate(0, 0.05, 0), mats.brass, 'sui3_needle', -0.08, -0.04, 0.006);
  ndl.rotation.z = 0.8;
  add(SUI[3], box(0.1, 0.024, 0.01), mats.plaster, 'sui3_val_a', 0.13, 0.04, 0);
  add(SUI[3], box(0.08, 0.024, 0.01), mats.verdigris, 'sui3_val_b', 0.12, -0.03, 0);
  // S4 房源清單+游標
  [0.09, 0, -0.09].forEach((yy, i) => {
    add(SUI[4], sph(0.016, 8, 6), mats.copper, 'sui4_ico_' + i, -0.17, yy, 0.004);
    add(SUI[4], box(0.28, 0.022, 0.01), mats.plaster, 'sui4_row_' + i, 0.02, yy, 0);
  });
  add(SUI[4], box(0.44, 0.07, 0.006), mats.brass, 'sui4_hl', 0, 0.09, -0.004);
  // S5 對話氣泡
  add(SUI[5], box(0.2, 0.07, 0.012), mats.plaster, 'sui5_chat_a', -0.1, 0.06, 0);
  add(SUI[5], box(0.22, 0.07, 0.012), mats.copper, 'sui5_chat_b', 0.08, -0.05, 0);
  add(SUI[5], sph(0.012, 8, 6), mats.plaster, 'sui5_dot_a', -0.21, 0.02, 0);
  add(SUI[5], sph(0.012, 8, 6), mats.copper, 'sui5_dot_b', 0.2, -0.09, 0);
  // 業務桌椅 ×2 + 圓凳
  [[-0.42, 1], [0.42, 1]].forEach((p, i) => {
    add(est, box(0.5, 0.035, 0.22), mats.wood, 'estate_desk_' + i, p[0], 0.53, -0.52);
    add(est, box(0.04, 0.38, 0.04), mats.ironDark, 'estate_deskleg_a' + i, p[0] - 0.2, 0.33, -0.52);
    add(est, box(0.04, 0.38, 0.04), mats.ironDark, 'estate_deskleg_b' + i, p[0] + 0.2, 0.33, -0.52);
    add(est, cyl(0.06, 0.065, 0.28, 10), mats.wood, 'estate_stool_' + i, p[0], 0.26, -0.2);
    add(est, box(0.14, 0.1, 0.02), mats.glassCool, 'estate_deskmon_' + i, p[0], 0.6, -0.6);
  });
  // 模型桌：小樓盤 + 圖釘
  add(est, box(0.5, 0.03, 0.34), mats.wood, 'estate_maptable', 0, 0.46, 0.35);
  add(est, box(0.1, 0.42, 0.1), mats.ironDark, 'estate_mapped', 0, 0.24, 0.35);
  const miniHouse = add(est, houseGeo(0.16, 0.16, 0.03), mats.copper, 'estate_minihouse', 0, 0.48, 0.3);
  miniHouse.rotation.y = 0.4;
  add(est, sph(0.016, 8, 6), mats.blossom, 'estate_pin_a', -0.14, 0.49, 0.4);
  add(est, sph(0.016, 8, 6), mats.verdigris, 'estate_pin_b', 0.15, 0.49, 0.44);
  // 冒泡氣泡(品牌) — 從樓盤模型冒出
  add(est, sph(0.026, 12, 8), mats.glassCool, 'estate_bubble_0', 0.03, 0.63, 0.32);
  add(est, sph(0.036, 12, 8), mats.glassCool, 'estate_bubble_1', -0.05, 0.74, 0.28);
  add(est, sph(0.048, 12, 8), mats.glassCool, 'estate_bubble_2', 0.06, 0.87, 0.3);
  add(est, sph(0.06, 12, 8), mats.glassCool, 'estate_bubble_3', -0.02, 1.02, 0.31);
  // 成果燈箱(主打：房型渲染) — 右內牆
  const lbx = grp(est, 'estate_lightbox', 1.23, 0.95, -0.1);
  lbx.rotation.y = -Math.PI / 2;
  add(lbx, box(0.56, 0.4, 0.03), mats.brass, 'lightbox_frame', 0, 0, -0.01);
  add(lbx, box(0.5, 0.34, 0.02), mats.glassWarm, 'lightbox_pane', 0, 0, 0.012);
  const lbh = add(lbx, houseGeo(0.15, 0.15, 0.016), mats.copper, 'lightbox_house', 0, -0.09, 0.026);
  add(lbx, box(0.2, 0.02, 0.014), mats.copper, 'lightbox_line_a', 0.12, 0.09, 0.026);
  add(lbx, box(0.14, 0.02, 0.014), mats.copper, 'lightbox_line_b', 0.09, 0.04, 0.026);
  // 導流場景(原則：不打自己人) — 暗色小屋→金箭頭→銅亮小屋
  add(est, box(0.34, 0.025, 0.3), mats.wood, 'referral_base', -1.08, 1.0, -0.7);
  const rhA = add(est, houseGeo(0.13, 0.13, 0.03), mats.iron, 'referral_house_peak', -1.17, 1.02, -0.64);
  rhA.rotation.y = 0.3;
  const rhB = add(est, houseGeo(0.16, 0.16, 0.03), mats.copper, 'referral_house_bubble', -0.98, 1.02, -0.74);
  rhB.rotation.y = -0.25;
  add(est, sph(0.024, 10, 8), mats.glassWarm, 'referral_glow', -0.98, 1.07, -0.72);
  const rArc = add(est, torus(0.1, 0.014, 8, 24, Math.PI * 0.75), mats.brass, 'referral_arrow', -1.08, 1.16, -0.69);
  rArc.rotation.z = 0.25; rArc.rotation.y = 0.12;
  const rTip = add(est, triPrism(0.05, 0.05, 0.02), mats.brass, 'referral_arrow_tip', -0.985, 1.15, -0.7);
  rTip.rotation.z = Math.PI + 0.3;
  // 詢問的客人：站在櫃旁，問題氣泡沿金點軌跡飛向「冒泡」小屋
  const rp = grp(est, 'referral_person', -1.02, 0.1, 0.18);
  rp.rotation.y = 2.5;
  add(rp, new THREE.ConeGeometry(0.13, 0.42, 16), mats.velvet, 'referral_person_body', 0, 0.21, 0);
  add(rp, sph(0.075, 14, 10), mats.plaster, 'referral_person_head', 0, 0.5, 0);
  add(rp, box(0.2, 0.13, 0.02), mats.plaster, 'referral_person_bubble', 0.1, 0.74, 0.02);
  add(rp, sph(0.02, 8, 6), mats.copper, 'referral_person_q', 0.1, 0.74, 0.04);
  add(rp, sph(0.014, 8, 6), mats.plaster, 'referral_person_tail', 0.03, 0.62, 0.01);
  add(est, sph(0.016, 8, 6), mats.brass, 'referral_trail_0', -1.03, 0.95, -0.08);
  add(est, sph(0.018, 8, 6), mats.brass, 'referral_trail_1', -1.06, 1.06, -0.32);
  add(est, sph(0.02, 8, 6), mats.brass, 'referral_trail_2', -1.06, 1.14, -0.55);
  // 檔案櫃
  add(est, box(0.32, 0.88, 0.34), mats.iron, 'estate_cabinet', -1.08, 0.56, -0.7);
  [0.3, 0.56, 0.82].forEach((yy, i) => {
    add(est, box(0.12, 0.025, 0.02), mats.brass, 'estate_drawer_' + i, -1.08, yy, -0.52);
  });
  const elight = new THREE.PointLight(0x7fc4de, 1.2, 4.5, 2);
  elight.name = 'estate_light';
  elight.position.set(0, 1.45, -0.1);
  est.add(elight);
  // 側掛招牌(房仲marquee) + 房屋圖標
  const bill = grp(est, 'estate_billboard', 1.36, 1.1, -0.2);
  tube(bill, mats.brass, 'bill_arm_top', [0, 0.35, 0], [0.42, 0.5, 0], 0.035, 8);
  tube(bill, mats.brass, 'bill_arm_bot', [0, -0.3, 0], [0.42, -0.42, 0], 0.035, 8);
  const panel = add(bill, box(0.09, 1.05, 0.85), mats.plaster, 'bill_panel', 0.48, 0.04, 0);
  add(bill, box(0.1, 0.09, 0.95), mats.brass, 'bill_frame_top', 0.48, 0.6, 0);
  add(bill, box(0.1, 0.09, 0.95), mats.brass, 'bill_frame_bot', 0.48, -0.51, 0);
  const houseIcon = add(bill, houseGeo(0.52, 0.52, 0.06), mats.copper, 'bill_house_icon', 0.53, -0.24, 0);
  houseIcon.rotation.y = Math.PI / 2;
  add(bill, sph(0.055, 10, 8), mats.glassWarm, 'bill_lamp', 0.48, 0.72, 0);
  // 雷達碟(物件情報)
  const radar = grp(est, 'anim_radar', 1.15, 2.0, 0.7);
  add(radar, cyl(0.03, 0.04, 0.5, 8), mats.iron, 'radar_pole', 0, -0.15, 0);
  const dish = add(radar, lathe([[0.02, 0], [0.16, 0.015], [0.27, 0.06], [0.33, 0.13]], 20), mats.copper, 'radar_dish', 0, 0.14, 0);
  dish.rotation.x = -1.0;
  tube(radar, mats.brass, 'radar_feed', [0, 0.14, 0], [0, 0.32, 0.14], 0.012, 6);
  anim.spinners.push({ node: radar, axis: 'y', speed: 0.7 });
  anim.swayFloors.push(est);

  // ============ 5F 室內設計(剖面工作室) ============
  const intr = grp(root, 'floor5_interior'); intr.position.set(-0.15, 11.86, -0.1);
  const DR5 = Math.PI / 180;
  add(intr, new THREE.CylinderGeometry(1.28, 1.35, 1.8, 24, 1, true, 50 * DR5, 260 * DR5), mats.wood, 'interior_wall', 0, 0.9, 0);
  add(intr, cyl(1.32, 1.32, 0.06, 32), mats.wood, 'interior_floor', 0, 0.03, 0);
  add(intr, cyl(1.26, 1.26, 0.05, 32), mats.plaster, 'interior_ceiling', 0, 1.76, 0);
  add(intr, torus(1.33, 0.07, 10, 44), mats.brass, 'interior_cornice', 0, 1.78, 0).rotation.x = Math.PI / 2;
  add(intr, torus(1.37, 0.08, 10, 44), mats.brass, 'interior_plinth', 0, 0.075, 0).rotation.x = Math.PI / 2;
  [40, 140].forEach((deg, i) => {
    const a = deg * DR5;
    add(intr, box(0.08, 1.8, 0.1), mats.brass, 'interior_jamb_' + i, Math.cos(a) * 1.3, 0.9, Math.sin(a) * 1.3).rotation.y = Math.PI / 2 - a;
  });
  // 凸窗(移到後側)
  const bayG = grp(intr, 'interior_baywin', 0, 0, 0);
  bayG.rotation.y = 230 * DR5;
  const bay = add(bayG, cyl(0.62, 0.62, 1.1, 20, false, 0, Math.PI), mats.glassWarm, 'interior_baywindow', 0, 0.85, 1.16);
  bay.rotation.y = -Math.PI / 2;
  add(bayG, box(0.05, 1.1, 0.05), mats.brass, 'interior_mullion_a', -0.3, 0.85, 1.62);
  add(bayG, box(0.05, 1.1, 0.05), mats.brass, 'interior_mullion_b', 0.3, 0.85, 1.62);
  add(bayG, cyl(0.66, 0.66, 0.07, 20, false, 0, Math.PI), mats.copper, 'interior_bay_roof', 0, 1.44, 1.16).rotation.y = -Math.PI / 2;
  // 陽台(移到右側)
  const balcG = grp(intr, 'interior_balcony_mount', 0, 0, 0);
  balcG.rotation.y = 150 * DR5;
  const balc = grp(balcG, 'interior_balcony', 0, 0, 0);
  add(balc, cyl(1.68, 1.68, 0.07, 20, false, -0.5, 1.0), mats.wood, 'balcony_floor', 0, 0.04, 0);
  const railTop = add(balc, torus(1.64, 0.03, 8, 20, 1.0), mats.brass, 'balcony_rail', 0, 0.62, 0);
  railTop.rotation.x = Math.PI / 2; railTop.rotation.z = Math.PI / 2 - 0.5;
  const railMid = add(balc, torus(1.64, 0.02, 8, 20, 1.0), mats.brass, 'balcony_rail_mid', 0, 0.35, 0);
  railMid.rotation.x = Math.PI / 2; railMid.rotation.z = Math.PI / 2 - 0.5;
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI / 2 - 0.5 + (i / 6) * 1.0;
    add(balc, cyl(0.018, 0.018, 0.58, 6), mats.ironDark, 'baluster_' + i, Math.cos(a) * 1.62, 0.33, Math.sin(a) * 1.62);
  }
  // —— 工作室陳設 ——
  add(intr, cyl(0.5, 0.5, 0.014, 24), mats.blossom, 'studio_rug', 0, 0.07, 0.05);
  // 沙發
  add(intr, box(0.42, 0.1, 0.18), mats.velvet, 'sofa_seat', -0.55, 0.19, -0.32).rotation.y = 0.7;
  add(intr, box(0.42, 0.17, 0.05), mats.velvet, 'sofa_back', -0.63, 0.3, -0.4).rotation.y = 0.7;
  add(intr, box(0.05, 0.15, 0.18), mats.velvet, 'sofa_arm_a', -0.38, 0.24, -0.46).rotation.y = 0.7;
  add(intr, box(0.05, 0.15, 0.18), mats.velvet, 'sofa_arm_b', -0.72, 0.24, -0.19).rotation.y = 0.7;
  // 繪圖桌 + 圓凳
  const draft = grp(intr, 'studio_drafting', 0.55, 0, -0.28);
  draft.rotation.y = -0.6;
  const dtop = add(draft, box(0.36, 0.02, 0.26), mats.wood, 'draft_top', 0, 0.44, 0);
  dtop.rotation.x = -0.45;
  const dpaper = add(draft, box(0.24, 0.006, 0.17), mats.plaster, 'draft_paper', 0, 0.46, 0.01);
  dpaper.rotation.x = -0.45;
  add(draft, box(0.03, 0.42, 0.03), mats.ironDark, 'draft_leg_a', -0.13, 0.21, 0.08);
  add(draft, box(0.03, 0.34, 0.03), mats.ironDark, 'draft_leg_b', 0.13, 0.17, 0.08);
  add(intr, cyl(0.07, 0.075, 0.26, 10), mats.wood, 'studio_stool', 0.3, 0.16, 0.02);
  // 展示架與花瓶
  add(intr, box(0.52, 0.72, 0.12), mats.wood, 'studio_shelf', 0.02, 0.42, -1.08);
  add(intr, box(0.46, 0.02, 0.09), mats.plaster, 'shelf_board_a', 0.02, 0.42, -1.06);
  add(intr, box(0.46, 0.02, 0.09), mats.plaster, 'shelf_board_b', 0.02, 0.62, -1.06);
  add(intr, lathe([[0.001, 0], [0.035, 0.01], [0.045, 0.05], [0.02, 0.09], [0.028, 0.12]], 12), mats.verdigris, 'vase_a', -0.08, 0.79, -1.05);
  add(intr, lathe([[0.001, 0], [0.04, 0.015], [0.03, 0.07], [0.012, 0.1]], 12), mats.copper, 'vase_b', 0.12, 0.79, -1.05);
  // 布卷
  const rollA = add(intr, cyl(0.045, 0.045, 0.62, 10), mats.velvet, 'fabric_roll_a', -0.98, 0.36, -0.14);
  rollA.rotation.z = 0.22;
  const rollB = add(intr, cyl(0.04, 0.04, 0.56, 10), mats.blossom, 'fabric_roll_b', -0.88, 0.33, -0.28);
  rollB.rotation.z = -0.18; rollB.rotation.x = 0.12;
  // 色票板
  const swatch = grp(intr, 'studio_swatchboard', 1.16, 1.0, 0.12);
  swatch.rotation.y = -Math.PI / 2;
  add(swatch, box(0.4, 0.16, 0.02), mats.plaster, 'swatch_frame', 0, 0, 0);
  add(swatch, box(0.1, 0.1, 0.015), mats.velvet, 'swatch_a', -0.13, 0, 0.012);
  add(swatch, box(0.1, 0.1, 0.015), mats.blossom, 'swatch_b', 0, 0, 0.012);
  add(swatch, box(0.1, 0.1, 0.015), mats.verdigris, 'swatch_c', 0.13, 0, 0.012);
  // 完工模擬畫架(發光完工圖) — 對應「主打」
  const esl = grp(intr, 'studio_render_easel', 0.82, 0, -0.52);
  esl.rotation.y = -0.3;
  tube(esl, mats.ironDark, 'easel_leg_a', [-0.15, 0, 0.06], [-0.05, 0.82, -0.02], 0.012, 8);
  tube(esl, mats.ironDark, 'easel_leg_b', [0.15, 0, 0.06], [0.05, 0.82, -0.02], 0.012, 8);
  tube(esl, mats.ironDark, 'easel_leg_c', [0, 0, -0.16], [0, 0.78, -0.06], 0.012, 8);
  const eslB = add(esl, box(0.34, 0.44, 0.02), mats.wood, 'easel_board', 0, 0.52, 0.035);
  eslB.rotation.x = -0.13;
  const eslP = add(esl, box(0.28, 0.35, 0.014), mats.glassWarm, 'easel_render', 0, 0.53, 0.052);
  eslP.rotation.x = -0.13;
  add(esl, box(0.38, 0.025, 0.05), mats.wood, 'easel_ledge', 0, 0.28, 0.06);
  // 一步一步材質階梯 — 對應「節奏」
  const steps = grp(intr, 'studio_steps', -0.28, 0, 0.42);
  steps.rotation.y = 0.5;
  add(steps, cyl(0.15, 0.17, 0.38, 14), mats.wood, 'steps_pedestal', 0, 0.19, 0);
  add(steps, box(0.13, 0.02, 0.11), mats.wood, 'steps_1', -0.06, 0.401, 0);
  add(steps, box(0.09, 0.05, 0.09), mats.blossom, 'steps_2_base', 0.03, 0.416, 0);
  add(steps, box(0.09, 0.02, 0.11), mats.blossom, 'steps_2', 0.03, 0.453, 0);
  add(steps, box(0.09, 0.1, 0.1), mats.verdigris, 'steps_3_base', 0.13, 0.441, 0);
  add(steps, box(0.11, 0.02, 0.11), mats.verdigris, 'steps_3', 0.13, 0.502, 0);
  add(steps, sph(0.022, 10, 8), mats.brass, 'steps_flag', 0.13, 0.545, 0);
  // 室內吸頂吸燈(可動)
  const lamp = grp(intr, 'lamp_pendant', 0, 1.74, 0.12);
  tube(lamp, mats.ironDark, 'lamp_rod', [0, 0, 0], [0, -0.26, 0], 0.012, 6);
  add(lamp, lathe([[0.01, 0], [0.13, 0.02], [0.16, 0.1], [0.05, 0.16], [0.01, 0.17]], 16), mats.copper, 'lamp_shade', 0, -0.42, 0);
  add(lamp, sph(0.055, 10, 8), mats.glassWarm, 'lamp_bulb', 0, -0.4, 0);
  anim.lanterns.push(lamp);
  const ilight = new THREE.PointLight(0xffb066, 2.6, 4.5, 2);
  ilight.name = 'interior_light';
  ilight.position.set(0, 1.3, 0);
  intr.add(ilight);
  anim.swayFloors.push(intr);

  // ============ 6F 婚禮廳(剖面禮堂) ============
  const wed = grp(root, 'floor6_wedding'); wed.position.set(0, 13.7, 0);
  const D2R = Math.PI / 180;
  // 剖開的環牆(開口朝 +z, 130°)
  add(wed, new THREE.CylinderGeometry(1.22, 1.28, 2.0, 24, 1, true, 65 * D2R, 230 * D2R), mats.plaster, 'wedding_wall', 0, 1.0, 0);
  add(wed, cyl(1.26, 1.26, 0.07, 32), mats.wood, 'wedding_floor', 0, 0.035, 0);
  add(wed, cyl(1.22, 1.22, 0.05, 32), mats.plaster, 'wedding_ceiling', 0, 1.96, 0);
  add(wed, torus(1.31, 0.06, 10, 44), mats.brass, 'wedding_cornice', 0, 2.02, 0).rotation.x = Math.PI / 2;
  add(wed, torus(1.36, 0.07, 10, 44), mats.brass, 'wedding_plinth', 0, 0.05, 0).rotation.x = Math.PI / 2;
  // 剖面收邊：兩側門柱 + 上下緣弧
  [25, 155].forEach((deg, i) => {
    const a = deg * D2R;
    const j = add(wed, box(0.09, 2.0, 0.12), mats.brass, 'wedding_jamb_' + i, Math.cos(a) * 1.24, 1.0, Math.sin(a) * 1.24);
    j.rotation.y = Math.PI / 2 - a;
  });
  // 剖面帷幕(天鵝絨) — 蓋住切口兩側
  [25, 155].forEach((deg, i) => {
    const a = deg * D2R;
    const cur = add(wed, cyl(0.13, 0.16, 1.86, 8), mats.velvet, 'wedding_curtain_' + i, Math.cos(a) * 1.1, 0.99, Math.sin(a) * 1.1);
    cur.scale.z = 0.55; cur.rotation.y = Math.PI / 2 - a;
    add(wed, sph(0.045, 8, 6), mats.brass, 'curtain_tieback_' + i, Math.cos(a) * 1.02, 0.55, Math.sin(a) * 1.02 + 0.06);
  });
  const lintel = add(wed, torus(1.25, 0.045, 8, 30, 130 * D2R), mats.brass, 'wedding_lintel', 0, 1.98, 0);
  lintel.rotation.x = Math.PI / 2; lintel.rotation.z = 25 * D2R;
  const sill = add(wed, torus(1.26, 0.035, 8, 30, 130 * D2R), mats.brass, 'wedding_sill', 0, 0.08, 0);
  sill.rotation.x = Math.PI / 2; sill.rotation.z = 25 * D2R;
  // 外牆柱列與側窗
  [175, 215, 255, 295, 335, 15].forEach((deg, i) => {
    const a = deg * D2R, cx = Math.cos(a) * 1.3, cz = Math.sin(a) * 1.3;
    add(wed, cyl(0.045, 0.055, 1.8, 10), mats.brass, 'wedding_col_' + i, cx, 0.95, cz);
    add(wed, sph(0.06, 10, 8), mats.brass, 'wedding_colcap_' + i, cx, 1.9, cz);
  });
  [195, 345].forEach((deg, i) => {
    const a = deg * D2R;
    const w = add(wed, archGeo(0.28, 0.72, 0.07), mats.glassWarm, 'wedding_win_' + i, Math.cos(a) * 1.21, 0.55, Math.sin(a) * 1.21);
    w.rotation.y = Math.PI / 2 - a;
  });
  // 心形玫瑰窗(後牆，內外皆見)
  const heart = add(wed, heartGeo(0.5, 0.09), mats.glassWarm, 'wedding_heart', 0, 1.18, -1.24);
  heart.rotation.y = Math.PI;
  add(wed, torus(0.28, 0.03, 8, 28), mats.brass, 'wedding_heart_ring', 0, 1.16, -1.2);
  // —— 內部陳設 ——
  add(wed, box(0.42, 0.02, 1.62), mats.velvet, 'wedding_carpet', 0, 0.082, 0.32);
  add(wed, torus(0.58, 0.042, 10, 30, Math.PI), mats.brass, 'wedding_arch', 0, 0.09, -0.52);
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI;
    add(wed, sph(0.052, 10, 8), i % 2 ? mats.blossom : mats.plaster, 'arch_rose_' + i, Math.cos(a) * 0.58, 0.09 + Math.sin(a) * 0.58, -0.52);
  }
  // 新人：男比讚、女比愛心(面向 +z 鏡頭)
  const bride = grp(wed, 'bride', -0.1, 0.09, -0.38);
  add(bride, lathe([[0.001, 0], [0.1, 0.008], [0.082, 0.05], [0.03, 0.17], [0.035, 0.21], [0.022, 0.24]], 16), mats.plaster, 'bride_dress', 0, 0, 0);
  add(bride, sph(0.042, 12, 9), mats.plaster, 'bride_head', 0, 0.28, 0);
  tube(bride, mats.plaster, 'bride_arm_l', [-0.062, 0.17, 0.012], [-0.024, 0.36, 0.02], 0.012, 8);
  tube(bride, mats.plaster, 'bride_arm_r', [0.062, 0.17, 0.012], [0.024, 0.36, 0.02], 0.012, 8);
  add(bride, heartGeo(0.115, 0.02), mats.blossom, 'bride_heart', 0, 0.425, 0.02);
  const groom = grp(wed, 'groom', 0.1, 0, -0.38);
  add(groom, box(0.09, 0.18, 0.055), mats.ironDark, 'groom_body', 0, 0.18, 0);
  add(groom, sph(0.042, 12, 9), mats.plaster, 'groom_head', 0, 0.37, 0);
  tube(groom, mats.ironDark, 'groom_arm', [0.052, 0.25, 0.008], [0.125, 0.32, 0.035], 0.013, 8);
  add(groom, sph(0.02, 10, 8), mats.plaster, 'groom_fist', 0.13, 0.335, 0.038);
  add(groom, cyl(0.0065, 0.0065, 0.034, 8), mats.plaster, 'groom_thumb', 0.13, 0.362, 0.038);
  // 賓客長椅 ×4
  [[-0.36, 0.12], [0.36, 0.12], [-0.36, 0.48], [0.36, 0.48]].forEach((p, i) => {
    add(wed, box(0.3, 0.035, 0.11), mats.wood, 'pew_seat_' + i, p[0], 0.13, p[1]);
    add(wed, box(0.3, 0.14, 0.025), mats.wood, 'pew_back_' + i, p[0], 0.2, p[1] + 0.06);
    add(wed, box(0.28, 0.09, 0.02), mats.wood, 'pew_leg_' + i, p[0], 0.045, p[1]);
  });
  // 婚禮蛋糕(側桌)
  add(wed, box(0.34, 0.02, 0.24), mats.wood, 'cake_table', -0.72, 0.2, -0.62);
  add(wed, box(0.024, 0.11, 0.024), mats.ironDark, 'cake_table_leg', -0.72, 0.135, -0.62);
  add(wed, cyl(0.105, 0.115, 0.05, 18), mats.plaster, 'cake_tier1', -0.72, 0.236, -0.62);
  add(wed, cyl(0.075, 0.08, 0.042, 16), mats.plaster, 'cake_tier2', -0.72, 0.282, -0.62);
  add(wed, cyl(0.046, 0.05, 0.036, 14), mats.plaster, 'cake_tier3', -0.72, 0.321, -0.62);
  add(wed, sph(0.024, 8, 6), mats.blossom, 'cake_topper', -0.72, 0.352, -0.62);
  // 婚紗模擬試衣鏡(AI 模擬畫面)＋人台 —— 對應「婚紗與場地模擬」
  const mir = grp(wed, 'wedding_mirror', 0.72, 0, -0.55);
  mir.rotation.y = -0.44;
  const mirFrame = add(mir, torus(0.155, 0.018, 10, 30), mats.brass, 'mirror_frame', 0, 0.42, 0);
  mirFrame.scale.y = 1.5;
  const mirGlass = add(mir, cyl(0.145, 0.145, 0.012, 24), mats.glassCool, 'mirror_glass', 0, 0.42, -0.005);
  mirGlass.rotation.x = Math.PI / 2; mirGlass.scale.x = 1.5;
  add(mir, sph(0.022, 8, 6), mats.brass, 'mirror_crest', 0, 0.68, 0);
  tube(mir, mats.ironDark, 'mirror_leg_a', [-0.1, 0, 0.06], [0, 0.36, 0], 0.008, 6);
  tube(mir, mats.ironDark, 'mirror_leg_b', [0.1, 0, 0.06], [0, 0.36, 0], 0.008, 6);
  add(mir, box(0.22, 0.016, 0.14), mats.wood, 'mirror_base', 0, 0.01, 0.02);
  const dressform = grp(wed, 'wedding_dressform', 0.48, 0, -0.78);
  add(dressform, lathe([[0.001, 0], [0.085, 0.006], [0.062, 0.06], [0.028, 0.16], [0.034, 0.2], [0.026, 0.23], [0.001, 0.24]], 14), mats.plaster, 'dressform_gown', 0, 0.09, 0);
  tube(dressform, mats.brass, 'dressform_pole', [0, 0.02, 0], [0, 0.09, 0], 0.006, 6);
  add(dressform, cyl(0.05, 0.06, 0.014, 12), mats.wood, 'dressform_base', 0, 0.03, 0);
  // 深夜接待台 —— 對應「半夜也接得住」：黃銅電話＋亮著的小燈＋預約簿
  const recep = grp(wed, 'wedding_reception', 0.95, 0.09, -0.1);
  recep.rotation.y = 0.9;
  add(recep, box(0.3, 0.02, 0.19), mats.wood, 'reception_desk', 0, 0.18, 0);
  add(recep, box(0.02, 0.09, 0.16), mats.ironDark, 'reception_leg_a', -0.12, 0.125, 0);
  add(recep, box(0.02, 0.09, 0.16), mats.ironDark, 'reception_leg_b', 0.12, 0.125, 0);
  add(recep, cyl(0.026, 0.03, 0.014, 12), mats.brass, 'phone_base', -0.07, 0.197, 0.02);
  tube(recep, mats.brass, 'phone_stem', [-0.07, 0.2, 0.02], [-0.07, 0.265, 0.02], 0.007, 8);
  add(recep, cyl(0.02, 0.011, 0.026, 10), mats.brass, 'phone_cup', -0.07, 0.28, 0.02);
  tube(recep, mats.brass, 'phone_hook', [-0.045, 0.24, 0.02], [-0.02, 0.245, 0.02], 0.005, 6);
  const ear = add(recep, cyl(0.011, 0.014, 0.05, 8), mats.ironDark, 'phone_ear', -0.015, 0.245, 0.02);
  ear.rotation.z = 1.35;
  tube(recep, mats.brass, 'reception_lamp_stem', [0.09, 0.19, -0.04], [0.09, 0.26, -0.04], 0.006, 6);
  add(recep, sph(0.021, 10, 8), mats.glassWarm, 'reception_lamp', 0.09, 0.275, -0.04);
  add(recep, box(0.07, 0.012, 0.05), mats.plaster, 'reception_book', 0.03, 0.192, 0.055).rotation.y = -0.2;
  // 24/7 手機(story 頁會做彈出動畫；檢視器頁為靜態立牌)
  const phone = grp(recep, 'wedding_phone', 0.02, 0.19, -0.055);
  const phoneBody = add(phone, box(0.078, 0.15, 0.01), mats.ironDark, 'phone_slab', 0, 0.075, 0);
  phoneBody.rotation.x = -0.14;
  const phoneScr = add(phone, box(0.067, 0.132, 0.006), mats.glassCool, 'phone_screen', 0, 0.077, 0.0065);
  phoneScr.rotation.x = -0.14;
  // 檔期日曆(左後牆) — 對應「年訂閱＋三重保障」
  const cal = grp(wed, 'wedding_calendar', -0.97, 1.05, -0.68);
  cal.rotation.y = 0.96;
  add(cal, box(0.24, 0.3, 0.014), mats.plaster, 'calendar_board', 0, 0, 0);
  add(cal, box(0.24, 0.055, 0.02), mats.velvet, 'calendar_header', 0, 0.122, 0.001);
  add(cal, torus(0.012, 0.004, 6, 12), mats.brass, 'calendar_ring_a', -0.06, 0.155, 0);
  add(cal, torus(0.012, 0.004, 6, 12), mats.brass, 'calendar_ring_b', 0.06, 0.155, 0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    add(cal, box(0.036, 0.03, 0.008), mats.ironDark, 'calendar_cell_' + r + c, -0.075 + c * 0.05, 0.055 - r * 0.075, 0.008);
  }
  add(cal, torus(0.024, 0.006, 8, 18), mats.velvet, 'calendar_mark', 0.025, -0.02, 0.016);
  add(cal, torus(0.024, 0.006, 8, 18), mats.brass, 'calendar_mark_b', -0.075, 0.055, 0.016);
  add(cal, torus(0.024, 0.006, 8, 18), mats.blossom, 'calendar_mark_c', 0.125, -0.095, 0.016);
  // 水晶吊燈(可動)
  const chand = grp(wed, 'wedding_chandelier', 0, 1.96, -0.05);
  tube(chand, mats.ironDark, 'chand_rod', [0, 0, 0], [0, -0.34, 0], 0.012, 6);
  add(chand, torus(0.17, 0.016, 8, 24), mats.brass, 'chand_ring', 0, -0.38, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    add(chand, cyl(0.008, 0.008, 0.05, 6), mats.plaster, 'chand_candle_' + i, Math.cos(a) * 0.17, -0.345, Math.sin(a) * 0.17);
    add(chand, sph(0.02, 8, 6), mats.glassWarm, 'chand_flame_' + i, Math.cos(a) * 0.17, -0.31, Math.sin(a) * 0.17);
  }
  add(chand, sph(0.045, 10, 8), mats.glassWarm, 'chand_core', 0, -0.42, 0);
  anim.lanterns.push(chand);
  // 壁燈 ×2
  [200, 340].forEach((deg, i) => {
    const a = deg * D2R;
    add(wed, sph(0.035, 8, 6), mats.glassWarm, 'wedding_sconce_' + i, Math.cos(a) * 1.1, 1.2, Math.sin(a) * 1.1);
    tube(wed, mats.brass, 'wedding_sconce_arm_' + i, [Math.cos(a) * 1.18, 1.12, Math.sin(a) * 1.18], [Math.cos(a) * 1.1, 1.18, Math.sin(a) * 1.1], 0.01, 6);
  });
  // 室內暖光
  const wlight = new THREE.PointLight(0xffb066, 3.2, 5.0, 2);
  wlight.name = 'wedding_light';
  wlight.position.set(0, 1.35, -0.05);
  wed.add(wlight);
  const wlightB = new THREE.PointLight(0xffb066, 1.1, 3.0, 2);
  wlightB.name = 'wedding_light_b';
  wlightB.position.set(0.95, 0.9, 0.6);
  wed.add(wlightB);
  // 洋蔥圓頂
  add(wed, lathe([[0.001, 0], [0.78, 0.03], [0.95, 0.28], [0.97, 0.55], [0.75, 1.0], [0.42, 1.35], [0.15, 1.62], [0.03, 1.82]], RS).scale(1.32, 1.04, 1.32), mats.verdigris, 'wedding_dome', 0, 2.02, 0);
  add(wed, torus(1.16, 0.05, 8, 44), mats.brass, 'dome_collar', 0, 2.1, 0).rotation.x = Math.PI / 2;
  anim.swayFloors.push(wed);

  // ============ 尖塔 + 婚戒 ============
  const spire = grp(root, 'spire_ring'); spire.position.set(0, 17.55, 0);
  add(spire, cyl(0.028, 0.05, 1.0, 10), mats.brass, 'spire_rod', 0, 0.5, 0);
  add(spire, sph(0.06, 10, 8), mats.brass, 'spire_knop', 0, 1.02, 0);
  const ringG = grp(spire, 'wedding_ring', 0, 1.52, 0);
  add(ringG, torus(0.42, 0.075, 14, 44), mats.brass, 'ring_band', 0, 0, 0);
  const dia = add(ringG, new THREE.OctahedronGeometry(0.13, 0), mats.glassCool, 'ring_diamond', 0, 0.56, 0);
  dia.scale.y = 1.35;
  add(ringG, box(0.16, 0.05, 0.05), mats.brass, 'ring_prong', 0, 0.47, 0);
  anim.ring = ringG;

  // ============ 煙囪 + 蒸汽 ============
  const stack = grp(root, 'smokestack');
  tube(stack, mats.ironDark, 'stack_main', [-2.35, 3.9, 1.15], [-2.35, 11.6, 1.15], 0.27, 20);
  for (let i = 0; i < 4; i++) {
    add(stack, torus(0.29, 0.035, 8, 28), mats.brass, 'stack_band_' + i, -2.35, 4.9 + i * 1.75, 1.15).rotation.x = Math.PI / 2;
  }
  add(stack, cyl(0.38, 0.3, 0.35, 20), mats.brass, 'stack_crown', -2.35, 11.75, 1.15);
  add(stack, cyl(0.02, 0.5, 0.3, 20), mats.ironDark, 'stack_cap', -2.35, 12.15, 1.15);
  tube(stack, mats.copper, 'stack_feed', [-2.3, 3.65, 1.05], [-1.9, 3.5, 0.95], 0.09, 12);
  const stackGear = grp(stack, 'anim_gear_stack_mount', -2.02, 6.4, 1.15);
  const sg = add(stackGear, gearGeo(0.28, 8, 0.09, 0.05), mats.brass, 'anim_gear_stack', 0, 0, 0);
  anim.gears.push({ node: sg, speed: 0.5 });
  const steam = grp(stack, 'steam', -2.35, 12.3, 1.15);
  steam.userData.noWire = true;
  for (let i = 0; i < 5; i++) {
    const sm = new THREE.MeshStandardMaterial({ color: 0xe6e1d6, roughness: 1, metalness: 0, transparent: true, opacity: 0.5, depthWrite: false, emissive: 0x9a958a, emissiveIntensity: 0.85 });
    sm.name = 'steam_' + i;
    const p = add(steam, sph(0.26 + i * 0.05, 14, 10), sm, 'steam_puff_' + i, 0, 0, 0);
    p.userData.noShadow = true;
    p.userData.phase = i / 5;
    anim.puffs.push(p);
  }
  anim.steamGroup = steam;

  // ============ 螺旋梯 ============
  const stairs = grp(root, 'stairs');
  const N = 24;
  let prev = null;
  for (let i = 0; i < N; i++) {
    const a = (140 + i * 10.8) * (Math.PI / 180);
    const y = 2.72 + (i / (N - 1)) * 2.45;
    const x = Math.cos(a) * 2.34, z = Math.sin(a) * 2.34;
    const st = add(stairs, box(0.6, 0.045, 0.27), mats.wood, 'stair_step_' + i, x, y, z);
    st.rotation.y = -(a + Math.PI / 2);
    const ox = Math.cos(a) * 2.62, oz = Math.sin(a) * 2.62;
    if (prev) tube(stairs, mats.brass, 'stair_rail_' + i, prev, [ox, y + 0.5, oz], 0.018, 6);
    if (i % 6 === 0) {
      tube(stairs, mats.ironDark, 'stair_post_' + i, [ox, y, oz], [ox, y + 0.5, oz], 0.02, 6);
      add(stairs, sph(0.04, 8, 6), mats.brass, 'stair_finial_' + i, ox, y + 0.54, oz);
    }
    prev = [ox, y + 0.5, oz];
  }

  // ============ 燈籠 ============
  const mkLantern = (name, x, y, z) => {
    const L = grp(root, name, x, y, z);
    tube(L, mats.ironDark, name + '_arm', [0, 0, 0], [0, 0.18, -0.3], 0.02, 6);
    const swingL = grp(L, name + '_swing', 0, 0, 0);
    add(swingL, cyl(0.09, 0.11, 0.2, 10), mats.glassWarm, name + '_glass', 0, -0.16, 0);
    add(swingL, cyl(0.12, 0.12, 0.04, 10), mats.ironDark, name + '_cap', 0, -0.04, 0);
    add(swingL, cyl(0.1, 0.1, 0.03, 10), mats.ironDark, name + '_base', 0, -0.28, 0);
    anim.lanterns.push(swingL);
    return L;
  };
  mkLantern('lantern_a', 1.35, 4.5, 1.75).rotation.y = -0.6;
  mkLantern('lantern_b', -0.9, 6.9, 1.55);

  // ============ 外部管線 ============
  const pipes = grp(root, 'pipes');
  tube(pipes, mats.copper, 'pipe_spine_a', [0.15, 4.2, -2.05], [0.15, 8.2, -1.62], 0.07, 14);
  tube(pipes, mats.copper, 'pipe_spine_b', [0.15, 8.2, -1.62], [0.35, 10.4, -1.15], 0.07, 14);
  add(pipes, sph(0.1, 10, 8), mats.copper, 'pipe_elbow_a', 0.15, 8.2, -1.62);
  [5.0, 6.6, 9.1].forEach((yy, i) => {
    const tt = (yy - 4.2) / 4.0;
    add(pipes, torus(0.085, 0.02, 8, 20), mats.brass, 'pipe_flange_' + i, 0.15 + (yy > 8.2 ? (yy - 8.2) / 2.2 * 0.2 : 0), yy, -2.05 + tt * 0.43).rotation.x = Math.PI / 2 - 0.1;
  });

  // explode vectors (also exported to GLB userData.extras)
  const EXPLODE = {
    legs: [0, -1.6, 0], chassis: [0, -0.8, 0],
    engine_boiler: [-1.6, -0.4, 1.2], engine_tanks: [0.3, -0.7, -1.9], engine_gears: [1.7, -0.6, 1.4],
    smokestack: [-2.4, 0.8, 1.2], stairs: [2.1, -0.1, -1.8], pipes: [0.5, 0, -2.2],
    lantern_a: [1.6, 0, 1.4], lantern_b: [-0.6, 0.4, 1.8],
    floor1_gov: [0, 1.1, 0], floor2_film: [1.4, 2.2, 0], floor3_funeral_ai: [-1.4, 3.4, 0],
    floor4_realestate: [1.4, 4.5, 0.35], floor5_interior: [-1.2, 5.7, 0], floor6_wedding: [0, 7.1, 0],
    spire_ring: [0, 8.9, 0],
  };
  for (const k in EXPLODE) {
    const o = root.getObjectByName(k);
    if (o) o.userData.explode = EXPLODE[k];
  }
  return { root, mats, anim };
}

// ---------------------------------------------------- 線稿 (blueprint) clone
export function buildWire(srcRoot, opts) {
  const o = opts || {};
  const inkColor = o.ink || 0xcfe4f6, paperColor = o.paper || 0x122a40;
  const ink = new THREE.LineBasicMaterial({ color: inkColor });
  ink.name = 'ink';
  const paper = new THREE.MeshBasicMaterial({ color: paperColor, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  paper.name = 'paper';
  function walk(src, dst) {
    for (const child of src.children) {
      if (child.userData.noWire) continue;
      if (child.isMesh) {
        const fill = new THREE.Mesh(child.geometry, paper);
        fill.name = child.name + '_fill';
        fill.position.copy(child.position); fill.rotation.copy(child.rotation); fill.scale.copy(child.scale); fill.quaternion.copy(child.quaternion);
        fill.userData.noShadow = true;
        dst.add(fill);
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, 12), ink);
        lines.name = child.name + '_line';
        lines.position.copy(child.position); lines.rotation.copy(child.rotation); lines.scale.copy(child.scale); lines.quaternion.copy(child.quaternion);
        lines.renderOrder = 1;
        dst.add(lines);
        if (child.children.length) walk(child, fill);
      } else {
        const g = new THREE.Group();
        g.name = child.name;
        g.position.copy(child.position); g.rotation.copy(child.rotation); g.scale.copy(child.scale);
        g.userData.explode = child.userData.explode;
        dst.add(g);
        walk(child, g);
      }
    }
  }
  const wroot = new THREE.Group();
  wroot.name = 'steampunk_tower_lineart';
  walk(srcRoot, wroot);
  return wroot;
}
