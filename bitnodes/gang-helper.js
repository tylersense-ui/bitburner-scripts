/** @param {NS} ns **/
export async function main(ns) {
    if (!ns.gang.inGang()) {
        ns.tprint("Pas dans un gang.");
        return;
    }

    ns.disableLog("ALL");
    ns.tail();

    const tasksMoney = ["Human Trafficking","Traffick Illegal Arms","Mug People"];
    const tasksRespect = ["Terrorism","Strongarm Civilians"];

    while (true) {
        ns.clearLog();

        const gang = ns.gang.getGangInformation();
        const members = ns.gang.getMemberNames();

        ns.print("Gang money/s:", ns.formatNumber(gang.moneyGainRate));
        ns.print("Gang respect/s:", ns.formatNumber(gang.respectGainRate));

        for (const m of members) {
            const info = ns.gang.getMemberInformation(m);

            let task =
                gang.wantedLevel > 5
                    ? "Vigilante Justice"
                    : (info.str + info.def > 400 ? tasksMoney[0] : tasksRespect[0]);

            ns.gang.setMemberTask(m, task);
            ns.print(`${m} → ${task}`);
        }

        await ns.sleep(5000);
    }
}
