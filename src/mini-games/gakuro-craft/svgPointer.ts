/** Convert through the rendered SVG transform, including letterboxing on wide screens. */
export function svgPointer(svg:SVGSVGElement,clientX:number,clientY:number){const matrix=svg.getScreenCTM();if(!matrix)return {x:0,y:0};const point=svg.createSVGPoint();point.x=clientX;point.y=clientY;return point.matrixTransform(matrix.inverse());}
