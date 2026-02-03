/** @param {NS} ns **/
export async function main(ns) {

    if (!ns.bladeburner.inBladeburner()) {
        ns.tprint("Pas dans Bladeburner.");
        return;
    }

    ns.disableLog("ALL");
    ns.tail();

    const MIN_CHANCE = 0.80;   // sécurité
    const MIN_STAM = 0.4;      // 40%

    const fmt = (n)=>ns.formatNumber(n,2);

    function bestAction() {
        const types = ["Contracts","Operations","BlackOps"];

        let best = null;
        let bestScore = 0;

        for (const type of types) {
            const actions = ns.bladeburner.getActionNames(type);

            for (const name of actions) {

                const [min,max] = ns.bladeburner.getActionEstimatedSuccessChance(type,name);
                const chance = (min+max)/2;

                const rep = ns.bladeburner.getActionRepGain(type,name);
                const time = ns.bladeburner.getActionTime(type,name);

                const score = rep / time;

                if (chance >= MIN_CHANCE && score > bestScore) {
                    bestScore = score;
                    best = {type,name,score,chance};
                }
            }
        }

        return best;
    }

    // ─────────────────────────────

    while(true) {

        ns.clearLog();

        const [cur,max] = ns.bladeburner.getStamina();
        const stamPct = cur/max;

        const city = ns.bladeburner.getCity();
        const chaos = ns.bladeburner.getCityChaos(city);

        ns.print("🗡️ BLADEBURNER HELPER");
        ns.print("---------------------------");
        ns.print("City   :", city);
        ns.print("Chaos  :", chaos.toFixed(1));
        ns.print("Stam   :", (stamPct*100).toFixed(1)+"%");

        // stamina low → regen
        if (stamPct < MIN_STAM) {
            ns.print("→ Recuperate");
            ns.bladeburner.startAction("General","Hyperbolic Regeneration Chamber");
            await ns.sleep(3000);
            continue;
        }

        // chaos high → diplomacy
        if (chaos > 50) {
            ns.print("→ Diplomacy");
            ns.bladeburner.startAction("General","Diplomacy");
            await ns.sleep(3000);
            continue;
        }

        const act = bestAction();

        if (act) {
            ns.print("");
            ns.print("Best:");
            ns.print(act.type, act.name);
            ns.print("Chance:", (act.chance*100).toFixed(1)+"%");
            ns.print("Score :", fmt(act.score));

            ns.bladeburner.startAction(act.type, act.name);
        }
        else {
            ns.print("Training...");
            ns.bladeburner.startAction("General","Training");
        }

        await ns.sleep(3000);
    }
}
