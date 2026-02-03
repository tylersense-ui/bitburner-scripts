/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const paybackLimit = 600; // 10 min

    while (true) {
        ns.clearLog();

        let best = null;
        let bestROI = 0;

        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            const stats = ns.hacknet.getNodeStats(i);
            const cost = ns.hacknet.getLevelUpgradeCost(i,1);
            const gain = stats.production * 0.05;

            const roi = gain / cost;

            if (roi > bestROI) {
                bestROI = roi;
                best = () => ns.hacknet.upgradeLevel(i,1);
            }
        }

        const newCost = ns.hacknet.getPurchaseNodeCost();
        if (1/newCost > bestROI) {
            best = () => ns.hacknet.purchaseNode();
        }

        if (best && bestROI * paybackLimit > 1) best();

        ns.print("Nodes:", ns.hacknet.numNodes());

        await ns.sleep(5000);
    }
}
