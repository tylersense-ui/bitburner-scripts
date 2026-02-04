
/** hacknet-tab-v2
 * Smart ROI manager with budget & safe mode
 * run ui/hacknet-tab-v2.js [budgetRatio=0.3]
 */

/** @param {NS} ns */
export async function main(ns){
    ns.disableLog("ALL");

    const ratio = Number(ns.args[0] ?? 0.3);

    while(true){
        const budget = ns.getServerMoneyAvailable("home") * ratio;

        let best = {cost:Infinity, fn:null};

        const buy = ns.hacknet.getPurchaseNodeCost();
        if(buy < best.cost) best={cost:buy, fn:()=>ns.hacknet.purchaseNode()};

        for(let i=0;i<ns.hacknet.numNodes();i++){
            const L=ns.hacknet.getLevelUpgradeCost(i,1);
            if(L<best.cost) best={cost:L, fn:()=>ns.hacknet.upgradeLevel(i,1)};

            const R=ns.hacknet.getRamUpgradeCost(i,1);
            if(R<best.cost) best={cost:R, fn:()=>ns.hacknet.upgradeRam(i,1)};

            const C=ns.hacknet.getCoreUpgradeCost(i,1);
            if(C<best.cost) best={cost:C, fn:()=>ns.hacknet.upgradeCore(i,1)};
        }

        if(best.cost < budget) best.fn();

        await ns.sleep(1500);
    }
}
