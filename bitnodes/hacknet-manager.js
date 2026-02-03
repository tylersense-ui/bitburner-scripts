/** @param {NS} ns **/
export async function main(ns){

    ns.disableLog("ALL");
    ns.tail();

    /* ================= CONFIG ================= */

    const args = ns.args;

    const DRY  = args.includes("--dry");
    const ONCE = args.includes("--once");
    const SAFE = args.includes("--safe");

    const budgetArg = getArg("--budget", 0);
    const roiArg    = getArg("--roi", null);
    const interval  = getArg("--interval", 2000);

    const MIN_CASH = budgetArg ?? (SAFE ? 1e9 : 0);
    const MAX_ROI  = roiArg ?? (SAFE ? 600 : Infinity); // seconds

    const fmt = n => ns.formatNumber(n,2);

    ns.print("Hacknet Manager v2");
    ns.print("MIN_CASH  "+fmt(MIN_CASH));
    ns.print("MAX_ROI   "+MAX_ROI+"s");
    ns.print(DRY  ? "DRY MODE"  : "");
    ns.print(ONCE ? "ONE SHOT"  : "");
    ns.print("");

    /* ================= LOOP ================= */

    while(true){

        const best = findBest();

        if(!best){
            ns.print("Nothing profitable");
            await ns.sleep(interval);
            continue;
        }

        const money = ns.getServerMoneyAvailable("home");

        ns.clearLog();
        ns.print("Best upgrade:");
        ns.print(best.desc);
        ns.print("Cost  "+fmt(best.cost));
        ns.print("Gain  "+fmt(best.gain)+"/s");
        ns.print("ROI   "+best.roi.toFixed(1)+"s");
        ns.print("Money "+fmt(money));

        if(DRY){
            await ns.sleep(interval);
            continue;
        }

        if(money - best.cost < MIN_CASH){
            ns.print("Blocked by budget");
            await ns.sleep(interval);
            continue;
        }

        if(best.roi > MAX_ROI){
            ns.print("ROI too long");
            await ns.sleep(interval);
            continue;
        }

        best.buy();

        ns.print("✓ purchased");

        if(ONCE) return;

        await ns.sleep(interval);
    }

    /* ================= CORE ================= */

    function findBest(){

        const nodes = ns.hacknet.numNodes();
        const options = [];

        const prod = i => ns.hacknet.getNodeStats(i).production;

        /* buy node */
        const newCost = ns.hacknet.getPurchaseNodeCost();
        if(isFinite(newCost)){
            const baseGain = nodes>0 ? prod(0) : 1;
            options.push({
                desc:"Buy node",
                cost:newCost,
                gain:baseGain,
                buy:()=>ns.hacknet.purchaseNode()
            });
        }

        /* upgrades */
        for(let i=0;i<nodes;i++){

            const before = prod(i);

            pushOpt(
                `Node ${i} +1 level`,
                ns.hacknet.getLevelUpgradeCost(i,1),
                () => ns.hacknet.upgradeLevel(i,1)
            );

            pushOpt(
                `Node ${i} +1 ram`,
                ns.hacknet.getRamUpgradeCost(i,1),
                () => ns.hacknet.upgradeRam(i,1)
            );

            pushOpt(
                `Node ${i} +1 core`,
                ns.hacknet.getCoreUpgradeCost(i,1),
                () => ns.hacknet.upgradeCore(i,1)
            );

            function pushOpt(desc,cost,buy){
                if(!isFinite(cost)) return;

                const gain = prod(i) - before + 0.0001;
                options.push({desc,cost,gain,buy});
            }
        }

        if(options.length===0) return null;

        for(const o of options)
            o.roi = o.cost / Math.max(o.gain,0.0001);

        options.sort((a,b)=>a.roi-b.roi);

        return options[0];
    }

    function getArg(flag,def){
        const i = args.indexOf(flag);
        if(i===-1) return def;
        return Number(args[i+1]);
    }
}
