"use strict";
/** REBIRTH 0.50 — deterministic environmental light, visible with Canvas fallback.
 * Layered on top of scene, under attack lines; never captures pointer events or changes rules.
 */
(() => {
    const colors = ['#83c8b4', '#a3dba9', '#b6a6ee', '#e3bda0', '#f0a2c3'];
    function paint(ctx, project, sector, rifts, now, reduced) {
        const color = colors[Math.max(0, Math.min(4, sector))];
        ctx.save();
        // Warm shaft from the distant lighthouse. Fades before tactical units.
        if (sector === 0) {
            ctx.globalAlpha = reduced ? .09 : .09 + .018 * Math.sin(now / 2100);
            const beam = ctx.createLinearGradient(505, 65, 400, 265);
            beam.addColorStop(0, '#e8d4a7');
            beam.addColorStop(1, '#e8d4a700');
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(568, 52);
            ctx.lineTo(500, 170);
            ctx.lineTo(432, 220);
            ctx.closePath();
            ctx.fill();
        }
        for (let i = 0; i < Math.min(6, rifts.length); i++) {
            const p = project(rifts[i].x, rifts[i].y);
            const pulse = reduced ? 1 : .9 + .12 * Math.sin(now / 480 + i * 2);
            const radius = 48 * pulse;
            const g = ctx.createRadialGradient(p.x, p.y - 8, 0, p.x, p.y - 8, radius);
            g.addColorStop(0, '#c991ee66');
            g.addColorStop(.42, '#be67bd24');
            g.addColorStop(1, '#ad75e400');
            ctx.globalAlpha = .72;
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y - 8, radius, radius * .66, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = .65;
            ctx.fillStyle = color;
            for (let j = 0; j < (reduced ? 2 : 5); j++) {
                const phase = j * 2.399 + i * 1.43, phaseTime = reduced ? 0 : now * .00036;
                const xx = p.x + Math.cos(phase + phaseTime) * 12, yy = p.y - 10 - Math.abs(Math.sin(phase + phaseTime)) * 13;
                ctx.fillRect(Math.round(xx), Math.round(yy), 2, j % 2 ? 2 : 3);
            }
        }
        ctx.restore();
    }
    window.AbyssAtmosphere = { paint };
})();
