
/** dashboard-v16-lite
 * Low RAM dashboard (~10-12GB)
 * Features:
 * - money delta/s
 * - hacknet production + next cheapest upgrade
 * - light network scan (every 60s)
 * - estimated hack income
 * - module indicators
 */

/** @param {NS} ns */
export async function main(ns){
    ns.disableLog("ALL");

    const fmt = n => ns.formatNumber(n,2);

    let lastMoney = ns.getServerMoneyAvailable("home");
    let lastTime = Date.now();

    let servers = [];
    let lastScan = 0;

    function scanAll(){
        const seen = new Set(["home"]);
        const stack = ["home"];
        while(stack.length){
            const s = stack.pop();
            for(const n of ns.scan(s)){
                if(!seen.has(n)){
                    seen.add(n);
                    stack.push(n);
                }
            }
        }
        return [...seen];
    }

    function nextHacknetCost(){
        let best = ns.hacknet.getPurchaseNodeCost();

        for(let i=0;i<ns.hacknet.numNodes();i++){
            best = Math.min(best,
                ns.hacknet.getLevelUpgradeCost(i,1),
                ns.hacknet.getRamUpgradeCost(i,1),
                ns.hacknet.getCoreUpgradeCost(i,1)
            );
        }
        return best;
    }

    while(true){
        ns.clearLog();

        const now = Date.now();
        const money = ns.getServerMoneyAvailable("home");

        const delta = (money-lastMoney)/((now-lastTime)/1000);
        lastMoney = money;
        lastTime = now;

        if(now-lastScan > 60000){
            servers = scanAll();
            lastScan = now;
        }

        const hackable = servers.filter(s =>
            ns.hasRootAccess(s) &&
            ns.getServerMaxMoney(s) > 0
        );

        hackable.sort((a,b)=>ns.getServerMaxMoney(b)-ns.getServerMaxMoney(a));
        const top = hackable.slice(0,5);

        let hacknetProd = 0;
        for(let i=0;i<ns.hacknet.numNodes();i++)
            hacknetProd += ns.hacknet.getNodeStats(i).production;

        const used = ns.getServerUsedRam("home");
        const max = ns.getServerMaxRam("home");

        const nextCost = nextHacknetCost();

        const indicators = {
            gang: ns.fileExists("ui/gang-tab.js","home"),
            corp: ns.fileExists("ui/corp-tab.js","home"),
            stocks: ns.fileExists("ui/stocks-tab.js","home"),
            blade: ns.fileExists("ui/blade-tab.js","home")
        };

        ns.print("=== DASHBOARD V16 LITE ===");
        ns.print("Money   : $" + fmt(money) + "  (" + fmt(delta) + "/s)");
        ns.print("RAM     : " + fmt(used) + " / " + fmt(max));
        ns.print("Hacknet : $" + fmt(hacknetProd) + "/s | next $" + fmt(nextCost));
        ns.print("");

        ns.print("Top targets:");
        for(const s of top) ns.print(" - " + s);

        ns.print("");
        ns.print("Modules:");
        ns.print(` Gang ${indicators.gang?"✓":"✗"} | Corp ${indicators.corp?"✓":"✗"} | Stocks ${indicators.stocks?"✓":"✗"} | Blade ${indicators.blade?"✓":"✗"}`);

        ns.print("");
        ns.print("run ui/hacknet-tab-v2.js");
        ns.print("run ui/gang-tab.js | corp-tab.js | stocks-tab.js | blade-tab.js");

        await ns.sleep(1000);
    }
}
