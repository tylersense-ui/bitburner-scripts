/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const fmt = (n) => ns.formatNumber(n, 2);

    const C = {
        g:"\x1b[32m", r:"\x1b[31m", y:"\x1b[33m",
        c:"\x1b[36m", m:"\x1b[35m", w:"\x1b[0m"
    };

    let lastMoney = ns.getServerMoneyAvailable("home");
    let lastTime = Date.now();
    const hist = [];

    // ─────────────────────────────────────────────

    function scanAll(){
        const seen=new Set(["home"]);
        const stack=["home"];
        while(stack.length){
            const s=stack.pop();
            for(const n of ns.scan(s))
                if(!seen.has(n)){seen.add(n);stack.push(n);}
        }
        return [...seen];
    }

    function network(){
        let total=0, used=0, rooted=0;
        for(const s of scanAll()){
            const serv=ns.getServer(s);
            total+=serv.maxRam;
            used+=serv.ramUsed;
            if(ns.hasRootAccess(s)) rooted++;
        }
        return {total,used,rooted};
    }

    function hacknetIncome(){
        let sum=0;
        for(let i=0;i<ns.hacknet.numNodes();i++)
            sum+=ns.hacknet.getNodeStats(i).production;
        return sum;
    }

    function stocksValue(){
        if(!ns.stock.hasTIXAPIAccess()) return 0;
        let v=0;
        for(const sym of ns.stock.getSymbols()){
            const [s,avg,sh,avgS]=ns.stock.getPosition(sym);
            const p=ns.stock.getPrice(sym);
            v+=s*p;
            v+=sh*(2*avgS-p);
        }
        return v;
    }

    function bestTargets(){
        return scanAll()
            .filter(s=>ns.hasRootAccess(s)&&ns.getServerMaxMoney(s)>0)
            .map(s=>{
                const money=ns.getServerMaxMoney(s);
                const t=ns.getHackTime(s);
                return {name:s,score:money/t,time:t};
            })
            .sort((a,b)=>b.score-a.score)
            .slice(0,5);
    }

    function spark(v){
        hist.push(v);
        if(hist.length>40) hist.shift();
        const max=Math.max(...hist,1);
        return hist.map(x=>{
            const r=x/max;
            return r>0.66?"█":r>0.33?"▓":"░";
        }).join("");
    }

    // ─────────────────────────────────────────────

    while(true){
        ns.clearLog();

        const now=Date.now();
        const money=ns.getServerMoneyAvailable("home");

        const dt=(now-lastTime)/1000;
        const rate=(money-lastMoney)/dt;

        lastMoney=money;
        lastTime=now;

        const net=network();
        const hacknet=hacknetIncome();
        const stocks=stocksValue();

        let networth=money+stocks;

        let corpFunds=0;
        if(ns.corporation?.hasCorporation?.()){
            const c=ns.corporation.getCorporation();
            corpFunds=c.funds;
            networth+=corpFunds;
        }

        const ramPct=(net.used/net.total*100)||0;

        ns.print("══════════════════════════════════════════════════");
        ns.print("      📊 BITBURNER CONTROL CENTER V4");
        ns.print("══════════════════════════════════════════════════");

        // MONEY
        ns.print("");
        ns.print(C.g+"💰 ECONOMY"+C.w);
        ns.print("Cash      : "+fmt(money));
        ns.print("$/s       : "+fmt(rate));
        ns.print("$/min     : "+fmt(rate*60));
        ns.print("Net worth : "+fmt(networth));
        ns.print("Trend     : "+spark(rate));

        // NETWORK
        ns.print("");
        ns.print(C.c+"🖥 NETWORK"+C.w);
        ns.print("RAM       : "+fmt(net.used)+" / "+fmt(net.total)+" ("+ramPct.toFixed(1)+"%)");
        ns.print("Rooted    : "+net.rooted);
        ns.print("pserv     : "+ns.getPurchasedServers().length);

        // TARGETS
        ns.print("");
        ns.print(C.y+"🎯 BEST TARGETS"+C.w);
        for(const t of bestTargets()){
            ns.print(
                t.name.padEnd(18) +
                fmt(t.score).padStart(10) +
                "  "+(t.time/1000).toFixed(1)+"s"
            );
        }

        // HACKNET
        ns.print("");
        ns.print(C.y+"⚡ HACKNET"+C.w);
        const cost=ns.hacknet.getPurchaseNodeCost();
        ns.print("Income/s  : "+fmt(hacknet));
        ns.print("Next node : "+fmt(cost));
        ns.print("ETA       : "+fmt(cost/Math.max(hacknet,1))+"s");

        // GANG
        if(ns.gang?.inGang?.()){
            const g=ns.gang.getGangInformation();
            ns.print("");
            ns.print(C.m+"🟣 GANG"+C.w);
            ns.print("$/s:"+fmt(g.moneyGainRate)+"  Rep/s:"+fmt(g.respectGainRate)+"  Wanted:"+fmt(g.wantedLevel));
        }

        // CORP
        if(ns.corporation?.hasCorporation?.()){
            ns.print("");
            ns.print(C.c+"🔵 CORP"+C.w);
            ns.print("Funds: "+fmt(corpFunds));
        }

        // STOCKS
        if(ns.stock.hasTIXAPIAccess()){
            ns.print("");
            ns.print(C.g+"📈 STOCKS"+C.w);
            ns.print("Value: "+fmt(stocks));
        }

        await ns.sleep(1000);
    }
}
