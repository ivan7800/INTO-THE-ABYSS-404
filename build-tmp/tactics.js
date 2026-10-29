/** INTO THE ABYSS 404 — REBIRTH v0.55
 * Type-checked, deterministic tactical rules. No DOM, Canvas, clock or storage.
 * Grid and combat forecasts are pure and may run in Node or any browser.
 */
var AbyssTactics;
(function (AbyssTactics) {
    AbyssTactics.BOARD_SIZE = 8;
    AbyssTactics.DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    function inside(x, y, size = AbyssTactics.BOARD_SIZE) { return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < size && y >= 0 && y < size; }
    AbyssTactics.inside = inside;
    function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    AbyssTactics.distance = distance;
    function cellKey(x, y) { return `${x},${y}`; }
    AbyssTactics.cellKey = cellKey;
    function occupied(s, x, y) {
        return s.units.some(u => u.hp > 0 && u.x === x && u.y === y) || s.buildings.some(b => b.hp > 0 && b.x === x && b.y === y) || s.rocks.some(r => r.x === x && r.y === y);
    }
    AbyssTactics.occupied = occupied;
    /** BFS ensures orthogonal reachability, avoids all occupied cells, and excludes the starting tile. */
    function reachable(s, u, size = AbyssTactics.BOARD_SIZE) {
        const range = Math.max(0, Math.floor(u.range ?? 0));
        const found = new Map([[cellKey(u.x, u.y), 0]]);
        const queue = [{ x: u.x, y: u.y, d: 0 }];
        for (let i = 0; i < queue.length; i++) {
            const p = queue[i];
            if (p.d >= range)
                continue;
            for (const [dx, dy] of AbyssTactics.DIRECTIONS) {
                const x = p.x + dx, y = p.y + dy, k = cellKey(x, y);
                if (!inside(x, y, size) || found.has(k) || occupied(s, x, y))
                    continue;
                found.set(k, p.d + 1);
                queue.push({ x, y, d: p.d + 1 });
            }
        }
        found.delete(cellKey(u.x, u.y));
        return found;
    }
    AbyssTactics.reachable = reachable;
    /** Original threat priorities preserved. Intent is locked for the entire enemy phase. */
    function intentFor(e, s) {
        const candidates = [
            ...s.buildings.filter(b => b.hp > 0).map(b => ({ ...b, kind: 'building' })),
            ...s.units.filter(u => u.side === 'ally' && u.hp > 0).map(u => ({ ...u, kind: 'unit' }))
        ];
        if (!candidates.length)
            return null;
        const danger = (p) => s.intent.some(i => i.x === p.x && i.y === p.y) ? 1 : 0;
        const score = (t) => distance(e, t) * 10 + (t.kind === 'building' ? 45 : 0) + (t.hp === 1 ? -3 : 0) + danger(t) * 5;
        candidates.sort((a, b) => score(a) - score(b) || a.y - b.y || a.x - b.x);
        const target = candidates[0];
        const attack = e.type === 'anchor' ? 'anchor' : e.type === 'stalker' ? 'drain' : e.type === 'vig' ? 'beam' : e.type === 'lar' ? 'corrupt' : e.type === 'herald' ? 'chorus' : e.type === 'boss' ? 'rupture' : e.type === 'leviathan' ? (e.hp <= 6 ? 'cataclysm' : 'rupture') : e.type === 'weaver' ? 'web' : e.type === 'seer' ? 'vision' : 'claw';
        let x = target.x, y = target.y;
        if (e.type === 'eng' && distance(e, target) > 1) {
            const options = AbyssTactics.DIRECTIONS.map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy })).filter(p => inside(p.x, p.y));
            options.sort((a, b) => distance(a, target) - distance(b, target));
            if (options[0]) {
                x = options[0].x;
                y = options[0].y;
            }
        }
        return { id: e.id, x, y, attack, damage: ['vig', 'boss', 'leviathan'].includes(e.type) ? 2 : 1 };
    }
    AbyssTactics.intentFor = intentFor;
    function omenFor(turn, sector) {
        if (turn < 2)
            return null;
        const locations = [{ x: 2, y: 5 }, { x: 6, y: 5 }, { x: 1, y: 4 }, { x: 5, y: 5 }, { x: 2, y: 2 }, { x: 6, y: 4 }];
        return { ...locations[(turn + sector * 2 - 2) % locations.length], type: turn % 2 === 0 ? 'fracture' : 'surge' };
    }
    AbyssTactics.omenFor = omenFor;
    function resonanceFor(s) {
        if (s.turn < 2)
            return null;
        const sources = s.units.filter(u => u.side === 'enemy' && u.hp > 0 && ['anchor', 'weaver', 'seer', 'leviathan'].includes(u.type)).sort((a, b) => a.id - b.id);
        for (const source of sources) {
            const rifts = s.rifts.filter(r => distance(r, source) <= 3).sort((a, b) => distance(a, source) - distance(b, source) || a.y - b.y || a.x - b.x);
            if (rifts.length)
                return { source: source.id, x: rifts[0].x, y: rifts[0].y };
        }
        return null;
    }
    AbyssTactics.resonanceFor = resonanceFor;
    function legalAttack(u, target, targetUnit, building, hasRift = false, purify = false) {
        const d = distance(u, target);
        if (u.type === 'pen')
            return d === 1 && targetUnit?.side === 'enemy';
        if (d < 1 || d > 3 + (u.attackBonus ?? 0))
            return false;
        if (u.type === 'her')
            return !(targetUnit?.side === 'ally' || building);
        if (u.type === 'viu')
            return targetUnit?.side === 'enemy' || (purify && hasRift);
        return false;
    }
    AbyssTactics.legalAttack = legalAttack;
    /** Returns damage actually dealt. Caller handles shields, side effects, event log and metrics. */
    function clampDamage(currentHP, amount) {
        return Math.min(Math.max(0, currentHP), Math.max(0, amount));
    }
    AbyssTactics.clampDamage = clampDamage;
    function corrupt(current, delta) { return Math.min(100, Math.max(0, current + delta)); }
    AbyssTactics.corrupt = corrupt;
})(AbyssTactics || (AbyssTactics = {}));
