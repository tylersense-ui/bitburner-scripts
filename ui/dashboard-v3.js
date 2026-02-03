/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const fmt = (n) => ns.formatNumber(n, 2);

    let lastMoney = ns.getServerMoneyAvailable("home");
    let lastTime = Date.now();

    const history = [];
    const HISTORY = 30;

    const C = {
        g: "\x1b[32m",
        r: "\x1b[31m",
        y: "\x1b[33m",
        c: "\x1b[36m",
        m: "\x1b[35m",
        w: "\x1b[0m"
    };

    function scanAll() {
        const seen = new Set(["home"]);
        const stack = ["home"];

        while (stack.length) {
            const s = stack.pop();
            for (const n of ns.scan(s)) {
                if (!seen.has(n)) {
                    seen.add(n);
                    stack.push(n);
                }
            }
        }
        return [...seen];
    }

    function networkStats() {
        let total = 0, used = 0;
        for (const s of scanAll()) {
            const serv = ns.getServer(s);
            total += serv.maxRam;
            used += serv.ramUsed;
        }
        return { total, used };
    }

    function hacknetIncome() {
        let sum = 0;
        for (let i = 0; i < ns.hacknet.numNodes(); i++)
            sum += ns.hacknet.getNodeStats(i).production;
        return sum;
    }

    function nextHacknetCost() {
        return ns.hacknet.getPurchaseNodeCost();
    }

    function stockValue() {
        if (!ns.stock.hasTIXAPIAccess()) return 0;
        let v = 0;
        for (const sym of ns.stock.getSymbols()) {
            const [s, avg, sh, avgS] = ns.stock.getPosition(sym);
            const p = ns.stock.getPrice(sym);
            v += s * p;
            v += sh * (2 * avgS - p);
        }
        return v;
    }

    function bestTargets() {
        return scanAll()
            .filter(s => ns.hasRootAccess(s) && ns.getServerMaxMoney(s) > 0)
            .map(s => ({
                name: s,
                score: ns.getServerMaxMoney(s) / ns.getHackTime(s)
            }))
            .sort((a,b)=>b.score-a.score)
            .slice(0,5);
    }

    function miniGraph(v) {
        const max = Math.max(...history, 1);
        const size = Math.floor((v / max) * 20);
        return "█".repeat(size);
    }

    while (true) {
        ns.clearLog();

        const now = Date.now();
        const money = ns.getServerMoneyAvailable("home");

        const dt = (now - lastTime)/1000;
        const rate = (money-lastMoney)/dt;

        lastMoney = money;
        lastTime = now;

        history.push(rate);
        if (history.length > HISTORY) history.shift();

        const net = networkStats();
        const hacknet = hacknetIncome();
        const hacknetCost = nextHacknetCost();
        const stocks = stockValue();

        let networth = money + stocks;

        let corpProfit = 0;
        if (ns.corporation?.hasCorporation?.()) {
            const c = ns.corporation.getCorporation();
            corpProfit = c.funds;
            networth += c.funds;
        }

        const ramPct = (net.used/net.total*100)||0;

        ns.print("══════════════════════════════════════════");
        ns.print("   📊 DASHBOARD V3");
        ns.print("══════════════════════════════════════════");

        // MONEY
        ns.print("");
        ns.print(C.g+"💰 MONEY"+C.w);
        ns.print("Cash     : " + fmt(money));
        ns.print("$/s      : " + fmt(rate));
        ns.print("$/min    : " + fmt(rate*60));
        ns.print("Net worth: " + fmt(networth));

        // GRAPH
        ns.print("Trend    : " + miniGraph(rate));

        // NETWORK
        ns.print("");
        ns.print(C.c+"🖥 NETWORK"+C.w);
        ns.print("RAM      : " + fmt(net.used)+" / "+fmt(net.total));
        ns.print("Usage    : " + ramPct.toFixed(1)+"%");

        // TARGETS
        ns.print("Top targets:");
        for (const t of bestTargets())
            ns.print("  " + t.name);

        // HACKNET
        ns.print("");
        ns.print(C.y+"⚡ HACKNET"+C.w);
        ns.print("Income/s : " + fmt(hacknet));
        ns.print("Next node: " + fmt(hacknetCost));
        ns.print("ETA      : " + fmt(hacknetCost/Math.max(hacknet,1))+"s");

        // GANG
        if (ns.gang?.inGang?.()) {
            const g = ns.gang.getGangInformation();
            ns.print("");
            ns.print(C.m+"🟣 GANG"+C.w);
            ns.print("$/s  : "+fmt(g.moneyGainRate));
            ns.print("Rep/s: "+fmt(g.respectGainRate));
            ns.print("Wanted: "+fmt(g.wantedLevel));
        }

        // CORP
        if (ns.corporation?.hasCorporation?.()) {
            ns.print("");
            ns.print(C.c+"🔵 CORP"+C.w);
            ns.print("Funds: "+fmt(corpProfit));
        }

        // STOCKS
        if (ns.stock.hasTIXAPIAccess()) {
            ns.print("");
            ns.print(C.g+"📈 STOCKS"+C.w);
            ns.print("Value: "+fmt(stocks));
        }

        await ns.sleep(1000);
    }
}
