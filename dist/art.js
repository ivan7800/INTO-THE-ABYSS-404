"use strict";
/* REBIRTH art direction — deterministic 16-bit-style isometric environment.
 * Rendering only: never touches combat state, saves, pathfinding or event handlers.
 * Low-resolution canvases are deliberately displayed with nearest-neighbour filtering. */
(() => {
    const themes = [
        { floor: '#354e55', lip: '#1b303e', line: '#728780', light: '#e4ba75', shadow: '#101b2a', roof: '#52676a', glow: '#b1e9d6', accent: '#756e64', water: '#244c58' },
        { floor: '#30483e', lip: '#182a2b', line: '#73866a', light: '#b2cb8d', shadow: '#0d1e22', roof: '#465c45', glow: '#a3e7a5', accent: '#526e58', water: '#24453d' },
        { floor: '#333d59', lip: '#1b213b', line: '#817ca1', light: '#d2a6d6', shadow: '#11172a', roof: '#4d4a6c', glow: '#b6a3f5', accent: '#71708d', water: '#29365b' },
        { floor: '#47464d', lip: '#242830', line: '#8d8587', light: '#d9ad7e', shadow: '#171d26', roof: '#62555a', glow: '#c7c3e0', accent: '#726d66', water: '#313c48' },
        { floor: '#49394e', lip: '#201b31', line: '#a48da7', light: '#e7a7be', shadow: '#130f21', roof: '#6b4c63', glow: '#f6a7df', accent: '#876e82', water: '#372b4c' }
    ];
    const cache = new Map();
    const rand = (x, y, s) => { let k = Math.imul(x + 73, 374761393) + Math.imul(y + 131, 668265263) + Math.imul(s + 31, 362437); k = Math.imul(k ^ (k >>> 13), 1274126177); return ((k ^ (k >>> 16)) >>> 0) / 4294967296; };
    const make = (kind, sector, variant) => {
        const t = themes[sector] ?? themes[0];
        const c = document.createElement('canvas');
        c.width = kind === 'tile' ? 68 : kind === 'rift' ? 60 : 52;
        c.height = kind === 'tile' ? 40 : kind === 'rift' ? 44 : 100;
        const g = c.getContext('2d');
        if (!g)
            throw Error('2D atlas context unavailable');
        const r = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
        const poly = (pts, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1))
            g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
        const line = (x, y, x2, y2, col, width = 1) => { g.strokeStyle = col; g.lineWidth = width; g.beginPath(); g.moveTo(x + .5, y + .5); g.lineTo(x2 + .5, y2 + .5); g.stroke(); };
        if (kind === 'tile') {
            // Black lower lip and offset paving: a miniature physical-looking tactical tile.
            poly([[34, 3], [67, 19], [34, 37], [1, 19]], t.lip);
            poly([[34, 0], [67, 17], [34, 34], [1, 17]], t.floor);
            line(1, 17, 34, 34, t.line);
            line(34, 34, 67, 17, t.line);
            g.save();
            g.beginPath();
            g.moveTo(34, 1);
            g.lineTo(65, 17);
            g.lineTo(34, 33);
            g.lineTo(3, 17);
            g.closePath();
            g.clip();
            for (let j = 0; j < 6; j++) {
                const yy = 2 + j * 6 + variant % 2 * 2;
                line(0, yy, 68, yy - 1, t.line);
                for (let i = 0; i < 5; i++) {
                    const xx = 7 + i * 15 + (j % 2) * 7;
                    line(xx, yy - 5, xx, yy - 1, t.lip);
                }
            }
            for (let i = 0; i < 27; i++) {
                const xx = Math.floor(rand(i, variant, sector) * 66), yy = Math.floor(rand(variant, i, sector + 11) * 31) + 2;
                r(xx, yy, i % 4 === 0 ? 3 : 2, 1, i % 3 === 0 ? t.light : t.shadow);
            }
            if (sector === 0) { // saltwater trickles, copper rivets and barnacles
                for (let i = 0; i < 3; i++) {
                    const xx = 12 + i * 17 + (variant % 3) * 2;
                    r(xx, 17 + i % 2 * 3, 8, 2, t.water);
                    r(xx + 1, 18 + i % 2 * 3, 3, 1, t.glow);
                }
            }
            else if (sector === 1) {
                for (let i = 0; i < 4; i++) {
                    const x = 9 + i * 15;
                    line(x, 9, x + 4, 15, t.shadow);
                    line(x + 4, 15, x + 7, 12, t.accent);
                }
            }
            else if (sector === 2) {
                line(23, 10, 33, 21, t.glow);
                line(33, 21, 39, 18, t.glow);
            }
            else if (sector === 3) {
                for (let i = 0; i < 5; i++)
                    r(10 + i * 10, 8 + i % 2 * 10, 8, 2, t.accent);
            }
            else {
                for (let i = 0; i < 6; i++)
                    r(13 + i * 7, 10 + i % 3 * 4, 2, 2, t.light);
            }
            g.restore();
        }
        else if (kind === 'building') {
            const height = variant % 3 === 2 ? 60 : variant % 3 === 1 ? 49 : 43, base = 91, top = base - height;
            // Architectural silhouettes: isometric roof and contrasting masonry sides.
            poly([[3, top], [24, top - 12], [49, top], [27, top + 12]], t.roof);
            poly([[3, top], [27, top + 12], [27, base], [3, base - 12]], t.floor);
            poly([[27, top + 12], [49, top], [49, base - 12], [27, base]], t.accent);
            line(3, top, 27, top + 12, t.line);
            line(27, top + 12, 49, top, t.line);
            line(27, top + 12, 27, base, t.shadow);
            for (let j = 0; j < 5; j++) {
                const y = top + 14 + j * 9;
                if (y > base - 10)
                    break;
                line(4, y, 26, y + 4, t.line);
                line(28, y + 4, 47, y, t.lip);
                for (let i = 0; i < 3; i++) {
                    r(5 + i * 7, y + 2, 3, 1, t.shadow);
                    r(31 + i * 5, y + 3, 2, 1, t.shadow);
                }
            }
            // Narrow gothic glowing windows recessed inside the masonry.
            for (let j = 0; j < 3; j++) {
                const y = top + 19 + j * 13;
                if (y > base - 15)
                    break;
                r(9, y, 5, 8, t.shadow);
                r(10, y + 1, 3, 5, (j + variant) % 3 === 0 ? t.light : '#28313d');
                r(18, y + 4, 4, 7, t.shadow);
                r(19, y + 5, 2, 4, j === 1 ? t.light : '#17232e');
                r(34, y, 5, 8, t.shadow);
                r(35, y + 1, 3, 5, (j + variant) % 2 ? t.light : '#202a39');
            }
            for (let i = 0; i < 4; i++) {
                const x = 7 + i * 10;
                line(x, top - 3 - i % 2 * 2, x + 7, top - 6 + i % 2 * 2, t.line);
            }
            // Sector-dependent towers and grotesque roof ornaments.
            if (sector === 0) {
                r(38, top - 13, 5, 16, t.shadow);
                r(39, top - 19, 3, 6, t.line);
                r(39, top - 16, 2, 2, t.light);
                r(11, base - 2, 5, 2, t.water);
            }
            if (sector === 1) {
                r(13, top - 17, 3, 17, t.accent);
                r(12, top - 22, 5, 7, t.line);
                r(9, top - 22, 9, 2, t.shadow);
            }
            if (sector === 2) {
                poly([[24, top - 27], [31, top - 6], [17, top - 7]], t.line);
                r(23, top - 14, 3, 7, t.glow);
            }
            if (sector === 3) {
                r(36, top - 17, 10, 19, t.roof);
                r(37, top - 14, 8, 8, t.shadow);
                r(39, top - 12, 4, 4, t.light);
            }
            if (sector === 4) {
                for (const x of [11, 37]) {
                    r(x, top - 11, 3, 11, t.line);
                    r(x + 1, top - 15, 1, 5, t.glow);
                }
            }
            r(3, base - 11, 23, 2, t.shadow);
            r(28, base - 2, 20, 2, t.shadow);
            // Pixel shadows at foot ground the building on the diamond.
            r(5, base, 40, 3, '#091420');
        }
        else if (kind === 'rock') {
            if (sector === 0) { // Broken dock machinery and a chain-ring
                poly([[6, 87], [9, 52], [32, 35], [44, 61], [46, 90]], t.floor);
                poly([[9, 52], [32, 35], [36, 55], [20, 63]], t.line);
                r(17, 39, 4, 17, t.accent);
                r(27, 51, 4, 16, t.lip);
                r(12, 70, 25, 3, t.shadow);
                r(31, 70, 5, 5, t.light);
                g.strokeStyle = t.light;
                g.lineWidth = 2;
                g.strokeRect(13, 58, 10, 9);
            }
            else if (sector === 1) {
                r(23, 31, 6, 60, t.shadow);
                for (let j = 0; j < 5; j++) {
                    const y = 14 + j * 12;
                    poly([[26, y], [8, y + 22], [43, y + 22]], j % 2 ? t.floor : t.accent);
                }
                r(23, 91, 7, 5, t.line);
            }
            else if (sector === 2 || sector === 4) {
                poly([[25, 10], [40, 40], [43, 92], [9, 92], [12, 40]], t.floor);
                poly([[25, 10], [40, 40], [24, 57], [12, 40]], t.line);
                r(24, 21, 3, 63, t.glow);
                r(12, 85, 26, 2, t.shadow);
            }
            else {
                r(7, 71, 39, 19, t.floor);
                r(12, 60, 29, 11, t.line);
                r(15, 51, 6, 17, t.accent);
                r(31, 53, 6, 16, t.accent);
                r(8, 91, 38, 3, t.shadow);
            }
            for (let i = 0; i < 13; i++) {
                const x = 9 + Math.floor(rand(i, variant, 4) * 33), y = 65 + Math.floor(rand(i, 3, variant) * 23);
                r(x, y, 2, 1, i % 2 ? t.light : t.shadow);
            }
        }
        else { // A tear in the physical world, with moving-looking concentric pixels.
            poly([[2, 22], [16, 12], [30, 15], [45, 5], [58, 19], [44, 32], [26, 29], [9, 39]], t.shadow);
            poly([[7, 23], [19, 15], [30, 18], [43, 10], [53, 20], [42, 28], [25, 25], [12, 33]], '#542b62');
            poly([[15, 23], [28, 20], [38, 13], [46, 20], [38, 25], [26, 23]], '#b66cc5');
            for (let i = 0; i < 9; i++) {
                const x = 8 + i * 5, y = 13 + (i * 7) % 19;
                r(x, y, 3, 2, i % 3 ? t.glow : '#ffc6e7');
            }
            r(24, 20, 13, 2, '#ffe0ff');
            r(36, 17, 3, 2, '#fff4ff');
        }
        return c;
    };
    const sprite = (kind, sector = 0, variant = 0) => {
        const k = `${kind}/${sector}/${variant}`;
        if (!cache.has(k))
            cache.set(k, make(kind, sector, variant));
        return cache.get(k);
    };
    const paint = (ctx, kind, p, sector = 0, variant = 0) => {
        if (!ctx?.drawImage)
            return false;
        const s = sprite(kind, sector, variant);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        // Underlying tactical movement/threat colors MUST remain visible.
        ctx.globalAlpha = kind === 'tile' ? .43 : 1;
        if (kind === 'tile')
            ctx.drawImage(s, Math.round(p.x - 34), Math.round(p.y - 20), 68, 40);
        else if (kind === 'rift')
            ctx.drawImage(s, Math.round(p.x - 30), Math.round(p.y - 23), 60, 44);
        else
            ctx.drawImage(s, Math.round(p.x - 26), Math.round(p.y - 98), 52, 100);
        ctx.restore();
        return true;
    };
    window.AbyssEnvironment = { sprite, paint, themes: themes.length, version: 'REBIRTH 0.40' };
})();
