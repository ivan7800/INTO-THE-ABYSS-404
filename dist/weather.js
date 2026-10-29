"use strict";
/** INTO THE ABYSS 404 v0.65 — sector-specific cinematic weather, no gameplay authority.
 * Deterministic, allocation-light Canvas2D painter. Designed for the Pixi/WebGL
 * compositor to consume as part of the tactical source texture.
 * Never changes state, hit testing, save data, rules, or input focus.
 */
(() => {
    const climates = [
        { name: 'LLUVIA NEGRA', description: 'Puerto · chubascos salinos', palette: '#acd0cd', intensity: 0.9 },
        { name: 'ESPORAS', description: 'Bosque · polen del otro lado', palette: '#bddda3', intensity: 0.85 },
        { name: 'MAREA ASTRAL', description: 'Ciudad sumergida · filamentos espectrales', palette: '#c4abe7', intensity: 0.75 },
        { name: 'CENIZA', description: 'Estación · residuos de la fractura', palette: '#dbbbaa', intensity: 0.8 },
        { name: 'SAL DE ESTRELLAS', description: 'Catedral · materia suspendida', palette: '#efbedc', intensity: 0.95 }
    ];
    const fract = (n) => n - Math.floor(n);
    const noise = (n) => fract(Math.sin(n * 127.1 + 19.3) * 43758.5453);
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    function describe(sector) { return climates[clamp(Math.floor(sector) || 0, 0, 4)]; }
    function paint(ctx, sector, now, quality, reduced, layer) {
        if (!ctx || typeof ctx.fillRect !== 'function')
            return;
        const id = clamp(Math.floor(sector) || 0, 0, 4), theme = describe(id), back = layer === 'back';
        const count = (quality === 'lite' ? 11 : back ? 52 : 37);
        // Front particles remain at <= 20% opacity on the tactical board. Back weather
        // can be stronger behind buildings and never obscures telegraph colors.
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, back ? 0 : 108, 640, back ? 172 : 455);
        ctx.clip();
        ctx.fillStyle = theme.palette;
        ctx.strokeStyle = theme.palette;
        const t = reduced ? 0 : now * 0.001;
        for (let i = 0; i < count; i++) {
            const seed = i * 5.37 + id * 37.1 + (back ? 0 : 119), w = noise(seed), h = noise(seed + 1.9), z = noise(seed + 3.7);
            let x = w * 640, y = h * (back ? 172 : 590);
            const speed = (.35 + z * .8) * (back ? .64 : 1);
            if (!reduced) {
                if (id === 0) {
                    x = (x - t * 23 * speed + 1280) % 640;
                    y = (y + t * 81 * speed) % (back ? 172 : 590);
                }
                else if (id === 3) {
                    x = (x + t * 15 * speed) % 640;
                    y = (y - t * 28 * speed + 1180) % (back ? 172 : 590);
                }
                else {
                    x = (x + Math.sin(t * .6 + i) * 18 * speed + 640) % 640;
                    y = (y - t * (12 + id * 5) * speed + 1180) % (back ? 172 : 590);
                }
            }
            if (!back && y < 108)
                continue;
            const alpha = back ? .22 : .10 + (z * .095);
            ctx.globalAlpha = alpha;
            if (id === 0) {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(Math.round(x), Math.round(y));
                ctx.lineTo(Math.round(x - 5 * speed), Math.round(y + 11 * speed));
                ctx.stroke();
            }
            else if (id === 1) {
                ctx.fillRect(Math.round(x), Math.round(y), z > .8 ? 3 : 2, z > .8 ? 3 : 2);
            }
            else if (id === 2) {
                ctx.fillRect(Math.round(x), Math.round(y), 1, 4 + z * 5);
            }
            else if (id === 3) {
                ctx.fillRect(Math.round(x), Math.round(y), 2, 1 + z * 2);
            }
            else {
                ctx.fillRect(Math.round(x), Math.round(y), z > .8 ? 3 : 2, 2);
            }
        }
        ctx.restore();
    }
    window.AbyssWeather = { paint, describe, version: '0.65' };
})();
