/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    let lastMoney = ns.getServerMoneyAvailable("home");
    let lastTime = Date.now();

    const fmt = (n) => ns.formatNumber(n, 2);

    function networkStats() {
        const visited = new Set(["home"]);
        const stack = ["home"];
        let total = 0;
        let used = 0;

        while (stack.length) {
            const s = stack.pop();
            const server = ns.getServer(s);

            total += server.maxRam;
            used += server.ramUsed;

            for (const n of ns.scan(s)) {
                if (!visited.has(n)) {
                    visited.add(n);
                    stack.push(n);
                }
            }
        }

        return { count: visited.size, total, used };
    }

    function hacknetIncome() {
        let sum = 0;
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            sum += ns.hacknet.getNodeStats(i).production;
        }
        return sum;
    }

    function stockValue() {
        if (!ns.stock.hasTIXAPIAccess()) return 0;

        let val = 0;
        for (const sym of ns.stock.getSymbols()) {
            const [shares, avg, sharesShort, avgShort] = ns.stock.getPosition(sym);

            const price = ns.stock.getPrice(sym);
            val += shares * price;
            val += sharesShort * (2 * avgShort - price);
        }
        return val;
    }

    while (true) {
        ns.clearLog();

        const now = Date.now();
        const money = ns.getServerMoneyAvailable("home");
        const rate = (money - lastMoney) / ((now - lastTime) / 1000);

        lastMoney = money;
        lastTime = now;

        const net = networkStats();
        const hacknet = hacknetIncome();
        const stocks = stockValue();

        ns.print("╔══════════════════════════════════╗");
        ns.print("        📊 DASHBOARD V2");
        ns.print("╚══════════════════════════════════╝");

        // Money
        ns.print("");
        ns.print("💰 MONEY");
        ns.print("Cash:     " + fmt(money));
        ns.print("Income/s: " + fmt(rate));

        // Network
        ns.print("");
        ns.print("🖥️ NETWORK");
        ns.print("Servers: " + net.count);
        ns.print("RAM:     " + fmt(net.used) + " / " + fmt(net.total));

        // Hacknet
        ns.print("");
        ns.print("⚡ HACKNET");
        ns.print("Income/s: " + fmt(hacknet));
        ns.print("Nodes:    " + ns.hacknet.numNodes());

        // Gang
        if (ns.gang?.inGang?.()) {
            const g = ns.gang.getGangInformation();
            ns.print("");
            ns.print("🟣 GANG");
            ns.print("Money/s:   " + fmt(g.moneyGainRate));
            ns.print("Respect/s: " + fmt(g.respectGainRate));
            ns.print("Wanted:    " + fmt(g.wantedLevel));
        }

        // Corp
        if (ns.corporation?.hasCorporation?.()) {
            const c = ns.corporation.getCorporation();
            ns.print("");
            ns.print("🔵 CORP");
            ns.print("Funds:  " + fmt(c.funds));
            ns.print("Profit: " + fmt(c.revenue - c.expenses));
        }

        // Stocks
        if (ns.stock.hasTIXAPIAccess()) {
            ns.print("");
            ns.print("📈 STOCKS");
            ns.print("Value: " + fmt(stocks));
        }

        await ns.sleep(1000);
    }
}
