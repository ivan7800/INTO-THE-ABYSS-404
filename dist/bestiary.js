"use strict";
/** Non-authoritative, accessible intelligence view. No combat state mutations. */
(() => {
    const titles = {
        eng: ['ENGENDRO', 'Acércate con precaución; su alcance inmediato amenaza los corredores.'],
        vig: ['VIGILANTE', 'Detecta rutas expuestas. Sus ataques anunciados permiten apartar a los Custodios.'],
        lar: ['LARVA DEL VACÍO', 'Una criatura persistente: evita bloquear rutas de repliegue.'],
        seer: ['ORÁCULO', 'Sus ojos anticipan movimientos; inspecciona la casilla amenazada.'],
        anchor: ['ANCLA', 'Una masa de corrupción que limita el movimiento entre edificios.'],
        weaver: ['TEJEDOR', 'Se extiende sobre las rutas; vigila los flancos antes del turno enemigo.'],
        stalker: ['ACECHANTE', 'Amenaza desde ángulos inesperados: reposiciona antes de atacar.'],
        herald: ['HERALDO', 'La resonancia anuncia una amenaza que debes neutralizar.'],
        leviathan: ['EL INNOMBRABLE', 'Objetivo final prioritario. Derrotarlo antes de finalizar el último turno.'],
        boss: ['HORROR MAYOR', 'Concentra daño y protege la red. No pierdas la iniciativa.']
    };
    const holder = document.querySelector('#bestiaryList');
    const summary = document.querySelector('#bestiary summary');
    let previous = '';
    function update(state) {
        if (!holder || !summary)
            return;
        const enemies = state.units.filter(u => u.side === 'enemy' && u.hp > 0);
        const digest = JSON.stringify(enemies.map(u => [u.id, u.name, u.type, u.hp, u.max, u.x, u.y, state.intent.find(t => t.id === u.id)]));
        summary.textContent = `CÓDICE DE HORRORES · ${enemies.length} ${enemies.length === 1 ? 'ENTIDAD' : 'ENTIDADES'}`;
        if (digest === previous)
            return;
        previous = digest;
        holder.replaceChildren();
        if (!enemies.length) {
            const p = document.createElement('p');
            p.textContent = 'No hay amenazas activas en este sector.';
            holder.append(p);
            return;
        }
        for (const u of enemies) {
            const item = document.createElement('article');
            item.className = 'codex-entry';
            const portrait = document.createElement('canvas');
            portrait.width = 48;
            portrait.height = 64;
            portrait.className = 'codex-sprite';
            portrait.setAttribute('role', 'img');
            portrait.setAttribute('aria-label', `Representación de ${u.name}`);
            const pic = window.AbyssPixel?.sprite(u.type, 0, u.hp / u.max <= .4);
            if (pic)
                portrait.getContext('2d')?.drawImage(pic, 0, 0);
            const desc = document.createElement('div');
            desc.className = 'codex-info';
            const strong = document.createElement('strong');
            strong.textContent = `${titles[u.type]?.[0] ?? u.name.toUpperCase()} · ${u.hp}/${u.max} PV`;
            const detail = document.createElement('p');
            detail.textContent = titles[u.type]?.[1] ?? 'Entidad desconocida. Revisa sus ataques anunciados.';
            const announced = state.intent.find(t => t.id === u.id);
            const warning = document.createElement('small');
            warning.textContent = announced ? `⚠ ATAQUE PREVISTO · CASILLA ${announced.x + 1},${announced.y + 1}` : 'SIN ATAQUE FIJADO';
            if (announced)
                warning.className = 'codex-alert';
            desc.append(strong, detail, warning);
            item.append(portrait, desc);
            holder.append(item);
        }
    }
    window.AbyssBestiary = { update };
})();
