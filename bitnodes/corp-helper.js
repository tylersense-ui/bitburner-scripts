/** @param {NS} ns **/
export async function main(ns) {
    if (!ns.corporation.hasCorporation()) return;

    ns.disableLog("ALL");
    ns.tail();

    while (true) {
        ns.clearLog();

        const c = ns.corporation.getCorporation();

        ns.print("Funds:", ns.formatNumber(c.funds));
        ns.print("Revenue:", ns.formatNumber(c.revenue));
        ns.print("Expenses:", ns.formatNumber(c.expenses));
        ns.print("Profit:", ns.formatNumber(c.revenue - c.expenses));

        await ns.sleep(2000);
    }
}
