import { drawQuantityProblemVisual } from './quantityVisualRenderer';
import { drawMeasurementProblemVisual } from './measurementVisualRenderer';
import { drawGraphProblemVisual } from './graphVisualRenderer';
import { drawMathConceptProblemVisual } from './mathConceptVisualRenderer';
import { drawScienceLifeProblemVisual } from './scienceLifeVisualRenderer';
import { drawSciencePhysicsProblemVisual } from './sciencePhysicsVisualRenderer';
import { drawScienceMatterProblemVisual } from './scienceMatterVisualRenderer';
import { drawScienceEarthProblemVisual } from './scienceEarthVisualRenderer';
import { drawScienceBiologyProblemVisual } from './scienceBiologyVisualRenderer';
import { drawSocialProblemVisual } from './socialVisualRenderer';
import { drawLanguageStructureProblemVisual } from './languageStructureVisualRenderer';
import { drawEnglishSupportProblemVisual } from './englishSupportVisualRenderer';
import type { GeneralProblem } from '../data/subjectData';
export function drawProblemVisual(canvas: HTMLCanvasElement, visual: NonNullable<GeneralProblem['visual']>) {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const logicalWidth = 260;
      const logicalHeight = 180;
      const renderScale = Math.max(1, Math.min(canvas.width / logicalWidth, canvas.height / logicalHeight));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
      const w = logicalWidth;
      const h = logicalHeight;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const backdrop = ctx.createLinearGradient(0, 0, w, h);
      backdrop.addColorStop(0, '#0b1220');
      backdrop.addColorStop(1, '#172033');
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 10; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 10; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;

      if (drawQuantityProblemVisual(ctx, visual, w, h)) return;
      if (drawMeasurementProblemVisual(ctx, visual, w, h)) return;
      if (drawGraphProblemVisual(ctx, visual, w, h)) return;
      if (drawMathConceptProblemVisual(ctx, visual, w, h)) return;
      if (drawScienceLifeProblemVisual(ctx, visual, w, h)) return;
      if (drawSciencePhysicsProblemVisual(ctx, visual, w, h)) return;
      if (drawScienceMatterProblemVisual(ctx, visual, w, h)) return;
      if (drawScienceEarthProblemVisual(ctx, visual, w, h)) return;
      if (drawScienceBiologyProblemVisual(ctx, visual, w, h)) return;
      if (drawSocialProblemVisual(ctx, visual, w, h)) return;
      if (drawLanguageStructureProblemVisual(ctx, visual, w, h)) return;
      if (drawEnglishSupportProblemVisual(ctx, visual, w, h)) return;

      if (visual.kind === 'map_symbol') {
        const cx = w / 2;
        const cy = h / 2;
        const stroke = '#111827';
        const fill = '#111827';
        const line = (x1: number, y1: number, x2: number, y2: number, width = 5) => {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        };
        const circle = (r: number, width = 5, filled = false) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          if (filled) {
            ctx.fillStyle = fill;
            ctx.fill();
          } else {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
          }
        };
        const text = (value: string, size = 52, y = cy + 18) => {
          ctx.fillStyle = fill;
          ctx.font = `bold ${size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(value, cx, y);
        };

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = stroke;
        ctx.fillStyle = fill;

        switch (visual.symbol) {
          case 'city_office':
            circle(42, 5);
            circle(22, 5);
            break;
          case 'town_office':
            circle(36, 5);
            break;
          case 'school':
            text('文', 64, cy + 8);
            break;
          case 'post_office':
          case 'post_office_round':
            if (visual.symbol === 'post_office_round') {
              circle(40, 5);
            }
            text('〒', 58, cy + 8);
            break;
          case 'temple':
            text('卍', 58, cy + 8);
            break;
          case 'shrine':
            line(cx - 34, cy - 22, cx + 34, cy - 22, 6);
            line(cx - 28, cy - 4, cx + 28, cy - 4, 6);
            line(cx - 18, cy - 22, cx - 18, cy + 34, 6);
            line(cx + 18, cy - 22, cx + 18, cy + 34, 6);
            break;
          case 'police_box':
            line(cx - 24, cy - 24, cx + 24, cy + 24, 6);
            line(cx + 24, cy - 24, cx - 24, cy + 24, 6);
            break;
          case 'police_station':
            circle(38, 5);
            line(cx - 22, cy - 22, cx + 22, cy + 22, 5);
            line(cx + 22, cy - 22, cx - 22, cy + 22, 5);
            break;
          case 'fire_station':
            line(cx, cy - 40, cx, cy + 34, 6);
            line(cx, cy - 8, cx - 28, cy - 34, 6);
            line(cx, cy - 8, cx + 28, cy - 34, 6);
            break;
          case 'factory':
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(cx, cy, 34, 0, Math.PI * 2);
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              const inner = 34;
              const outer = 48;
              ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
              ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
            }
            ctx.stroke();
            break;
          case 'health_center':
            circle(38, 5);
            line(cx - 18, cy, cx + 18, cy, 6);
            line(cx, cy - 18, cx, cy + 18, 6);
            break;
          case 'hospital':
            ctx.strokeRect(cx - 34, cy - 28, 68, 56);
            line(cx - 16, cy, cx + 16, cy, 6);
            line(cx, cy - 16, cx, cy + 16, 6);
            break;
          case 'rice_field':
            ctx.strokeRect(cx - 34, cy - 34, 68, 68);
            line(cx, cy - 34, cx, cy + 34, 5);
            line(cx - 34, cy, cx + 34, cy, 5);
            break;
          case 'farm':
            line(cx - 34, cy + 26, cx - 8, cy - 12, 5);
            line(cx - 10, cy + 26, cx + 16, cy - 12, 5);
            line(cx + 14, cy + 26, cx + 40, cy - 12, 5);
            break;
          case 'orchard':
            circle(24, 5);
            line(cx, cy - 6, cx, cy - 34, 5);
            line(cx, cy - 34, cx + 16, cy - 44, 5);
            break;
          case 'tea_field':
            circle(6, 1, true);
            ctx.beginPath();
            ctx.arc(cx - 18, cy + 10, 6, 0, Math.PI * 2);
            ctx.arc(cx + 18, cy + 10, 6, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'broadleaf_forest':
            ctx.beginPath();
            ctx.arc(cx, cy - 6, 26, 0, Math.PI * 2);
            ctx.stroke();
            line(cx, cy + 18, cx, cy + 44, 5);
            break;
          case 'conifer_forest':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 42);
            ctx.lineTo(cx - 28, cy + 12);
            ctx.lineTo(cx + 28, cy + 12);
            ctx.closePath();
            ctx.stroke();
            line(cx, cy + 12, cx, cy + 40, 5);
            break;
          case 'cemetery':
            line(cx, cy - 28, cx, cy + 28, 6);
            line(cx - 20, cy - 8, cx + 20, cy - 8, 6);
            circle(4, 1, true);
            break;
          case 'castle_ruins':
            ctx.strokeRect(cx - 34, cy - 8, 68, 28);
            line(cx - 34, cy - 8, cx - 34, cy - 26, 5);
            line(cx - 10, cy - 8, cx - 10, cy - 26, 5);
            line(cx + 14, cy - 8, cx + 14, cy - 26, 5);
            line(cx + 34, cy - 8, cx + 34, cy - 26, 5);
            break;
          case 'fire_brigade':
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
              const x = cx + Math.cos(a) * 34;
              const y = cy + Math.sin(a) * 34;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            circle(4, 1, true);
            break;
          case 'self_defense_force':
            line(cx, cy - 34, cx, cy + 22, 6);
            ctx.beginPath();
            ctx.moveTo(cx, cy - 34);
            ctx.lineTo(cx + 28, cy - 20);
            ctx.lineTo(cx, cy - 6);
            ctx.closePath();
            ctx.fill();
            break;
          case 'lighthouse':
            ctx.strokeRect(cx - 14, cy - 30, 28, 54);
            line(cx - 24, cy + 24, cx + 24, cy + 24, 5);
            line(cx + 14, cy - 18, cx + 34, cy - 30, 4);
            line(cx + 16, cy - 6, cx + 42, cy - 6, 4);
            break;
          case 'court':
            ctx.strokeRect(cx - 34, cy - 34, 68, 68);
            line(cx - 20, cy - 20, cx + 20, cy + 20, 5);
            line(cx + 20, cy - 20, cx - 20, cy + 20, 5);
            break;
          case 'wasteland':
            line(cx - 28, cy + 26, cx - 12, cy - 22, 5);
            line(cx - 4, cy + 26, cx + 12, cy - 22, 5);
            line(cx + 20, cy + 26, cx + 36, cy - 22, 5);
            line(cx - 20, cy + 6, cx + 28, cy + 6, 5);
            break;
          case 'sandy_area':
            for (const [dx, dy] of [[-26, -14], [0, -22], [24, -8], [-14, 14], [14, 20], [34, 18]]) {
              ctx.beginPath();
              ctx.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          case 'government_office':
            ctx.strokeRect(cx - 38, cy - 38, 76, 76);
            ctx.strokeRect(cx - 24, cy - 24, 48, 48);
            break;
          case 'power_station':
            circle(40, 5);
            line(cx, cy - 28, cx, cy + 28, 6);
            break;
          case 'weather_station':
            circle(40, 5);
            line(cx - 20, cy - 18, cx + 20, cy - 18, 4);
            line(cx - 24, cy, cx + 24, cy, 4);
            line(cx - 20, cy + 18, cx + 20, cy + 18, 4);
            break;
          case 'hot_spring':
            text('♨', 58, cy + 8);
            break;
          case 'museum':
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(a) * 36;
              const y = cy + Math.sin(a) * 36;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.strokeRect(cx - 16, cy - 14, 32, 28);
            break;
          case 'library':
            circle(40, 5);
            ctx.strokeRect(cx - 18, cy - 22, 36, 44);
            line(cx, cy - 22, cx, cy + 22, 3);
            break;
          case 'monument':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 38);
            ctx.lineTo(cx - 20, cy + 30);
            ctx.lineTo(cx + 20, cy + 30);
            ctx.closePath();
            ctx.stroke();
            break;
          case 'electronic_control_point':
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2;
              const x = cx + Math.cos(a) * 34;
              const y = cy + Math.sin(a) * 34;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            circle(4, 1, true);
            break;
          case 'triangulation_point':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 34);
            ctx.lineTo(cx - 30, cy + 24);
            ctx.lineTo(cx + 30, cy + 24);
            ctx.closePath();
            ctx.stroke();
            break;
          case 'benchmark':
            ctx.strokeRect(cx - 18, cy - 18, 36, 36);
            break;
          case 'mulberry_field':
            circle(36, 5);
            line(cx - 18, cy - 18, cx + 18, cy + 18, 5);
            line(cx + 18, cy - 18, cx - 18, cy + 18, 5);
            line(cx - 6, cy - 28, cx + 26, cy + 4, 5);
            break;
          case 'bamboo_grove':
            line(cx - 20, cy - 30, cx - 20, cy + 30, 5);
            line(cx, cy - 30, cx, cy + 30, 5);
            line(cx + 20, cy - 30, cx + 20, cy + 30, 5);
            line(cx - 28, cy - 10, cx - 12, cy - 22, 4);
            line(cx + 8, cy + 4, cx + 28, cy - 10, 4);
            break;
          case 'smokestack':
            line(cx, cy - 34, cx, cy + 28, 8);
            line(cx - 18, cy + 28, cx + 18, cy + 28, 5);
            break;
          case 'crater':
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              line(cx, cy, cx + Math.cos(a) * 32, cy + Math.sin(a) * 32, 3);
            }
            break;
          case 'quarry':
            circle(36, 3);
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
          case 'oil_gas_well':
            line(cx - 22, cy + 26, cx, cy - 34, 5);
            line(cx + 22, cy + 26, cx, cy - 34, 5);
            line(cx - 30, cy + 6, cx + 30, cy + 6, 5);
            break;
          case 'observatory':
            circle(28, 5);
            line(cx - 14, cy + 20, cx + 20, cy - 14, 5);
            break;
          case 'wetland':
            line(cx - 42, cy + 16, cx + 42, cy + 16, 4);
            line(cx - 38, cy + 30, cx + 38, cy + 30, 4);
            circle(4, 1, true);
            ctx.beginPath();
            ctx.arc(cx - 20, cy, 4, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy - 8, 4, 0, Math.PI * 2);
            ctx.arc(cx + 26, cy + 2, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'historic_site':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 30);
            ctx.bezierCurveTo(cx + 18, cy - 44, cx + 34, cy - 12, cx, cy + 18);
            ctx.bezierCurveTo(cx - 34, cy - 12, cx - 18, cy - 44, cx, cy - 30);
            ctx.stroke();
            line(cx, cy + 18, cx, cy + 34, 4);
            break;
          case 'hydro_power':
            ctx.strokeRect(cx - 28, cy - 24, 56, 48);
            ctx.beginPath();
            ctx.moveTo(cx - 14, cy + 30);
            ctx.quadraticCurveTo(cx - 6, cy + 12, cx + 2, cy + 30);
            ctx.quadraticCurveTo(cx + 10, cy + 48, cx + 18, cy + 30);
            ctx.stroke();
            break;
          default:
            text('?', 62, cy + 10);
            break;
        }
      }

      if (visual.kind === 'clock') {
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.38;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + Math.cos(a) * (r * 0.82);
          const y1 = cy + Math.sin(a) * (r * 0.82);
          const x2 = cx + Math.cos(a) * (r * 0.95);
          const y2 = cy + Math.sin(a) * (r * 0.95);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        const minuteAngle = (visual.minute / 60) * Math.PI * 2 - Math.PI / 2;
        const hourValue = (visual.hour % 12) + visual.minute / 60;
        const hourAngle = (hourValue / 12) * Math.PI * 2 - Math.PI / 2;

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(hourAngle) * (r * 0.52), cy + Math.sin(hourAngle) * (r * 0.52));
        ctx.stroke();

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(minuteAngle) * (r * 0.78), cy + Math.sin(minuteAngle) * (r * 0.78));
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visual.kind === 'polygon') {
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.35;
        const sides = Math.max(3, visual.sides);
        const points: Array<{ x: number; y: number }> = [];
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          points.push({ x, y });
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        if (visual.showDiagonals && sides >= 4) {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          for (let i = 0; i < sides - 2; i++) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[i + 2].x, points[i + 2].y);
            ctx.stroke();
          }
        }

        if (visual.labels) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          points.forEach((pt, i) => {
            const label = visual.labels?.[i];
            if (!label) return;
            const dx = pt.x - cx;
            const dy = pt.y - cy;
            const len = Math.hypot(dx, dy) || 1;
            ctx.fillText(label, pt.x + (dx / len) * 16, pt.y + (dy / len) * 16);
          });
        }
      }

      if (visual.kind === 'angle') {
        if (visual.parallelLines) {
          const left = w * 0.18;
          const right = w * 0.82;
          const yTop = h * 0.32;
          const yBottom = h * 0.68;
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(left, yTop);
          ctx.lineTo(right, yTop);
          ctx.moveTo(left, yBottom);
          ctx.lineTo(right, yBottom);
          ctx.stroke();

          const tx1 = w * 0.36;
          const ty1 = h * 0.12;
          const tx2 = w * 0.64;
          const ty2 = h * 0.88;
          ctx.strokeStyle = '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(tx1, ty1);
          ctx.lineTo(tx2, ty2);
          ctx.stroke();

          const rad = (visual.degrees * Math.PI) / 180;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w * 0.44, yTop, 26, 0, rad, false);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(w * 0.56, yBottom, 26, Math.PI, Math.PI + rad, false);
          ctx.stroke();

          if (visual.labels) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            visual.labels[0] && ctx.fillText(visual.labels[0], w * 0.47, yTop + 34);
            visual.labels[1] && ctx.fillText(visual.labels[1], w * 0.53, yBottom - 18);
          }
        } else {
          const cx = w * 0.5;
          const cy = h * 0.75;
          const len = Math.min(w, h) * 0.36;
          const base = 0;
          const other = -(visual.degrees * Math.PI / 180);

          const x1 = cx + Math.cos(base) * len;
          const y1 = cy + Math.sin(base) * len;
          const x2 = cx + Math.cos(other) * len;
          const y2 = cy + Math.sin(other) * len;

          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x1, y1);
          ctx.moveTo(cx, cy);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          const arcR = len * 0.35;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, arcR, other, base, false);
          ctx.stroke();

          if (visual.rightAngleMark || visual.degrees === 90) {
            const mark = 18;
            ctx.beginPath();
            ctx.moveTo(cx + mark, cy);
            ctx.lineTo(cx + mark, cy - mark);
            ctx.lineTo(cx, cy - mark);
            ctx.stroke();
          }
        }
      }

      if (visual.kind === 'circle') {
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.33;

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        if (visual.showDiameter) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx - r, cy);
          ctx.lineTo(cx + r, cy);
          ctx.stroke();
        }
        if (visual.showRadius) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + r, cy);
          ctx.stroke();
        }
        if (visual.showChord) {
          const angleA = -Math.PI * 0.82;
          const angleB = -Math.PI * 0.18;
          const ax = cx + Math.cos(angleA) * r;
          const ay = cy + Math.sin(angleA) * r;
          const bx = cx + Math.cos(angleB) * r;
          const by = cy + Math.sin(angleB) * r;
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        if (visual.centralAngle) {
          const start = -Math.PI / 2;
          const end = start + (visual.centralAngle * Math.PI) / 180;
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(start) * r, cy + Math.sin(start) * r);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(end) * r, cy + Math.sin(end) * r);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.28, start, end, false);
          ctx.stroke();
        }
        if (visual.inscribedAngle) {
          const vertexAngle = Math.PI * 0.7;
          const vx = cx + Math.cos(vertexAngle) * r;
          const vy = cy + Math.sin(vertexAngle) * r;
          const start = -Math.PI / 2;
          const end = start + ((visual.inscribedAngle * 2 * Math.PI) / 180);
          const ax = cx + Math.cos(start) * r;
          const ay = cy + Math.sin(start) * r;
          const bx = cx + Math.cos(end) * r;
          const by = cy + Math.sin(end) * r;
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.lineTo(ax, ay);
          ctx.moveTo(vx, vy);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        if (visual.labels) {
          const labelPoints = [
            { x: cx, y: cy - r - 12 },
            { x: cx + r + 14, y: cy + 4 },
            { x: cx, y: cy + r + 18 },
            { x: cx - r - 14, y: cy + 4 },
          ];
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          visual.labels.forEach((label, i) => {
            const pt = labelPoints[i];
            if (!label || !pt) return;
            ctx.fillText(label, pt.x, pt.y);
          });
        }
      }

      if (visual.kind === 'cube') {
        const size = Math.min(w, h) * 0.34;
        const ox = w * 0.36;
        const oy = h * 0.58;
        const dx = size * 0.35;
        const dy = size * 0.28;

        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 3;

        // front face
        ctx.strokeRect(ox, oy - size, size, size);
        // back face
        ctx.strokeRect(ox + dx, oy - size - dy, size, size);
        // connectors
        ctx.beginPath();
        ctx.moveTo(ox, oy - size);
        ctx.lineTo(ox + dx, oy - size - dy);
        ctx.moveTo(ox + size, oy - size);
        ctx.lineTo(ox + size + dx, oy - size - dy);
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + dx, oy - dy);
        ctx.moveTo(ox + size, oy);
        ctx.lineTo(ox + size + dx, oy - dy);
        ctx.stroke();

        if (visual.showHiddenEdges) {
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox + dx, oy - dy);
          ctx.lineTo(ox + dx, oy - size - dy);
          ctx.moveTo(ox + dx, oy - dy);
          ctx.lineTo(ox + size + dx, oy - dy);
          ctx.stroke();
          ctx.restore();
        }

        if (visual.labels) {
          const labelPts = [
            { x: ox - 10, y: oy + 12 },
            { x: ox + size + 12, y: oy + 12 },
            { x: ox + size + dx + 12, y: oy - dy + 4 },
            { x: ox + dx - 10, y: oy - dy + 4 },
          ];
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          visual.labels.forEach((label, i) => {
            const pt = labelPts[i];
            if (!label || !pt) return;
            ctx.fillText(label, pt.x, pt.y);
          });
        }
      }

      if (visual.kind === 'prism') {
        const sides = Math.max(3, visual.baseSides);
        const r = Math.min(w, h) * (sides >= 6 ? 0.15 : sides === 5 ? 0.165 : 0.18);
        const frontCx = w * (sides >= 5 ? 0.35 : 0.38);
        const frontCy = h * 0.58;
        const dx = w * (sides >= 5 ? 0.26 : 0.22);
        const dy = -h * (sides >= 5 ? 0.12 : 0.16);
        const front: Array<{ x: number; y: number }> = [];
        const back: Array<{ x: number; y: number }> = [];

        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
          const x = frontCx + Math.cos(a) * r;
          const y = frontCy + Math.sin(a) * r;
          front.push({ x, y });
          back.push({ x: x + dx, y: y + dy });
        }

        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        front.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        back.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        front.forEach((pt, i) => {
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(back[i].x, back[i].y);
          ctx.stroke();
        });
      }

      if (visual.kind === 'cylinder') {
        const cx = w * 0.5;
        const topY = h * 0.28;
        const bottomY = h * 0.72;
        const rx = w * 0.2;
        const ry = h * 0.08;

        if (visual.showNet) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w * 0.28, h * 0.5, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeRect(w * 0.4, h * 0.36, w * 0.28, h * 0.28);
          ctx.beginPath();
          ctx.arc(w * 0.8, h * 0.5, 26, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - rx, topY);
          ctx.lineTo(cx - rx, bottomY);
          ctx.moveTo(cx + rx, topY);
          ctx.lineTo(cx + rx, bottomY);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, bottomY, rx, ry, 0, 0, Math.PI);
          ctx.stroke();
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.ellipse(cx, bottomY, rx, ry, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (visual.showHeight) {
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx, bottomY);
            ctx.stroke();
          }
          if (visual.showRadius) {
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx + rx, topY);
            ctx.stroke();
          }
        }
      }

      if (visual.kind === 'pyramid') {
        const sides = Math.max(3, visual.baseSides);
        const cx = w * 0.5;
        const cy = h * 0.7;
        const r = Math.min(w, h) * (sides >= 5 ? 0.16 : 0.18);
        const apex = { x: w * 0.5, y: h * 0.18 };
        const base: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2 + Math.PI / sides;
          base.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.55 });
        }

        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        base.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        base.forEach((pt) => {
          ctx.beginPath();
          ctx.moveTo(apex.x, apex.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        });
      }

      if (visual.kind === 'cone') {
        const cx = w * 0.5;
        const topY = h * 0.18;
        const baseY = h * 0.72;
        const rx = w * 0.22;
        const ry = h * 0.08;

        if (visual.showNet) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w * 0.28, h * 0.52, 28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(w * 0.62, h * 0.3);
          ctx.arc(w * 0.62, h * 0.52, 70, -Math.PI / 3, Math.PI / 3, false);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, topY);
          ctx.lineTo(cx - rx, baseY);
          ctx.moveTo(cx, topY);
          ctx.lineTo(cx + rx, baseY);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, baseY, rx, ry, 0, 0, Math.PI);
          ctx.stroke();
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.ellipse(cx, baseY, rx, ry, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (visual.showHeight) {
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx, baseY);
            ctx.stroke();
          }
          if (visual.showRadius) {
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, baseY);
            ctx.lineTo(cx + rx, baseY);
            ctx.stroke();
          }
        }
      }

      if (visual.kind === 'parabola') {
        const originX = w * 0.5;
        const originY = h * 0.78;
        const scaleX = w * 0.09;
        const scaleY = h * 0.06;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, originY);
        ctx.lineTo(w * 0.88, originY);
        ctx.moveTo(originX, h * 0.16);
        ctx.lineTo(originX, h * 0.88);
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('x', w * 0.88, originY - 8);
        ctx.fillText('y', originX + 14, h * 0.18);
        ctx.fillText('O', originX - 12, originY + 14);

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        let started = false;
        for (let px = -3; px <= 3; px += 0.05) {
          const py = visual.a * px * px;
          const sx = originX + px * scaleX;
          const sy = originY - py * scaleY;
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();

        if (visual.markX !== undefined) {
          const px = visual.markX;
          const py = visual.a * px * px;
          const sx = originX + px * scaleX;
          const sy = originY - py * scaleY;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, originY);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(`x=${px}`, sx, originY + 18);
        }
      }

      if (visual.kind === 'bar_chart') {
        const values = visual.values.slice(0, 5);
        if (values.length === 0) return;
        const maxV = Math.max(...values, 1);
        const baseY = h * 0.82;
        const left = w * 0.12;
        const chartW = w * 0.76;
        const barW = chartW / values.length * 0.65;
        const gap = chartW / values.length * 0.35;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left, baseY);
        ctx.lineTo(left + chartW, baseY);
        ctx.stroke();

        values.forEach((v, i) => {
          const bh = (v / maxV) * (h * 0.55);
          const x = left + i * (barW + gap) + gap * 0.5;
          const y = baseY - bh;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x, y, barW, bh);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), x + barW / 2, y - 4);
          if (visual.labels && visual.labels[i]) {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(visual.labels[i], x + barW / 2, baseY + 14);
          }
        });
      }

      if (visual.kind === 'dots') {
        const rows = visual.counts.length;
        const rowGap = h / (rows + 1);
        visual.counts.forEach((count, ri) => {
          const y = rowGap * (ri + 1);
          const maxPerRow = 10;
          const spacing = 18;
          const rowWidth = Math.min(count, maxPerRow) * spacing;
          let sx = (w - rowWidth) / 2;
          for (let i = 0; i < count; i++) {
            const col = i % maxPerRow;
            const row = Math.floor(i / maxPerRow);
            const x = sx + col * spacing;
            const yy = y + row * 16;
            ctx.fillStyle = ri % 2 === 0 ? '#22d3ee' : '#60a5fa';
            ctx.beginPath();
            ctx.arc(x, yy, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          if (visual.labels && visual.labels[ri]) {
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(visual.labels[ri], 8, y + 4);
          }
        });
      }

      if (visual.kind === 'number_sequence') {
        const vals = visual.values;
        const n = vals.length;
        const pad = 12;
        const bw = (w - pad * 2) / Math.max(1, n);
        vals.forEach((v, i) => {
          const x = pad + i * bw + 2;
          const y = h * 0.35;
          const ww = bw - 4;
          const hh = 52;
          ctx.fillStyle = '#0b1220';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.fillRect(x, y, ww, hh);
          ctx.strokeRect(x, y, ww, hh);
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), x + ww / 2, y + 33);
        });
      }

      if (visual.kind === 'fraction') {
        const cx = w / 2;
        const cy = h / 2;
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        if (visual.whole !== undefined) {
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText(String(visual.whole), cx - 55, cy + 6);
        }
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(String(visual.numerator), cx + (visual.whole !== undefined ? 20 : 0), cy - 18);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3;
        const fx = cx + (visual.whole !== undefined ? 20 : 0);
        ctx.beginPath();
        ctx.moveTo(fx - 24, cy);
        ctx.lineTo(fx + 24, cy);
        ctx.stroke();
        ctx.fillText(String(visual.denominator), fx, cy + 30);
      }

      if (visual.kind === 'fraction_operation') {
        const drawFrac = (x: number, y: number, n: number, d: number) => {
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(String(n), x, y - 16);
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 22, y);
          ctx.lineTo(x + 22, y);
          ctx.stroke();
          ctx.fillText(String(d), x, y + 26);
        };
        const cy = h / 2;
        drawFrac(w * 0.28, cy, visual.left.n, visual.left.d);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(visual.op, w * 0.50, cy + 8);
        drawFrac(w * 0.72, cy, visual.right.n, visual.right.d);
      }
    } catch (e) {
      console.warn('visual render failed', e);
    }

}
