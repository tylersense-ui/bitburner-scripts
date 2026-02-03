/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const n = ns.sleeve.getNumSleeves();

    while (true) {
        ns.clearLog();

        for (let i = 0; i < n; i++) {
            const s = ns.sleeve.getSleeveStats(i);

            if (s.shock > 0)
                ns.sleeve.setToShockRecovery(i);
            else if (s.str < 100)
                ns.sleeve.setToGymWorkout(i, "powerhouse gym", "str");
            else
                ns.sleeve.setToCommitCrime(i, "Mug");

            ns.print(`Sleeve ${i} shock:${s.shock}`);
        }

        await ns.sleep(5000);
    }
}
