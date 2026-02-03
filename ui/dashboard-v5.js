/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const fmt = (n)=>ns.formatNumber(n,2);

    const C={
        g:"\x1b[32m", y:"\x1b[33m", c:"\x1b[36m",
        m:"\x1b[35m", r:"\x1b[31m", w:"\x1b[0m"
    };

    let tab=1;

    let lastMoney=ns.getServerMoneyAvailable("home");
    let lastTime=Date.now();
    const hist=[];

    // ─────────────────────────────────────
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

    function spark(v){
        hist.push(v);
        if(hist.length>40) hist.shift();
        const max=Math.max(...hist,1);
        return hist.map(x=>{
            const r=x/max;
            return r>.66?"█":r>.33?"▓":"░";
        }).join("");
    }

    function keyCheck(){
        const p=ns.peek(1);
        if(typeof p==="number"&&p>=1&&p<=6){
            tab=p;
            ns.readPort(1);
        }
    }

    // ─────────────────────────────────────
    //  SCREENS
    // ─────────────────────────────────────

    function screenOverview(rate,networth,ramPct){
        ns.print(C.g+"OVERVIEW"+C.w);
        ns.print("Cash     : "+fmt(lastMoney));
        ns.print("$/s      : "+fmt(rate));
        ns.print("Net worth: "+fmt(networth));
        ns.print("Trend    : "+spark(rate));
        ns.print("");
        ns.print("RAM used : "+ramPct.toFixed(1)+"%");
    }

    function screenNetwork(){
        ns.print(C.c+"NETWORK"+C.w);

        const rows=scanAll()
            .map(s=>{
                const serv=ns.getServer(s);
                return {s,ram:serv.maxRam,used:serv.ramUsed};
            })
            .filter(x=>x.ram>0)
            .sort((a,b)=>b.ram-a.ram)
            .slice(0,20);

        for(const r of rows){
            ns.print(
                r.s.padEnd(18)+
                fmt(r.used).padStart(8)+"/"+
                fmt(r.ram)
            );
        }
    }

    function screenTargets(){
        ns.print(C.y+"TARGETS"+C.w);

        const rows=scanAll()
            .filter(s=>ns.hasRootAccess(s)&&ns.getServerMaxMoney(s)>0)
            .map(s=>{
                const score=ns.getServerMaxMoney(s)/ns.getHackTime(s);
                return {s,score,time:ns.getHackTime(s)};
            })
            .sort((a,b)=>b.score-a.score)
            .slice(0,15);

        for(const r of rows){
            ns.print(
                r.s.padEnd(18)+
                fmt(r.score).padStart(10)+
                " "+(r.time/1000).toFixed(1)+"s"
            );
        }
    }

    function screenHacknet(){
        ns.print(C.y+"HACKNET"+C.w);

        let total=0;

        for(let i=0;i<ns.hacknet.numNodes();i++){
            const p=ns.hacknet.getNodeStats(i).production;
            total+=p;
            ns.print("Node "+i+" : "+fmt(p));
        }

        const cost=ns.hacknet.getPurchaseNodeCost();

        ns.print("");
        ns.print("Total/s : "+fmt(total));
        ns.print("Next    : "+fmt(cost));
        ns.print("ETA     : "+fmt(cost/Math.max(total,1))+"s");
    }

    function screenGang(){
        if(!ns.gang?.inGang?.()){
            ns.print("No gang");
            return;
        }

        ns.print(C.m+"GANG"+C.w);

        const names=ns.gang.getMemberNames();

        for(const n of names){
            const m=ns.gang.getMemberInformation(n);
            ns.print(
                n.padEnd(14)+
                m.task.padEnd(18)+
                fmt(m.earnedMoney)
            );
        }
    }

    function screenCorp(){
        ns.print(C.c+"CORP / STOCKS"+C.w);

        if(ns.corporation?.hasCorporation?.()){
            const c=ns.corporation.getCorporation();
            ns.print("Funds : "+fmt(c.funds));
            ns.print("Profit: "+fmt(c.revenue-c.expenses));
        }

        if(ns.stock.hasTIXAPIAccess()){
            let v=0;
            for(const sym of ns.stock.getSymbols()){
                const [s,avg]=ns.stock.getPosition(sym);
                v+=s*ns.stock.getPrice(sym);
            }
            ns.print("Stocks: "+fmt(v));
        }
    }

    // ─────────────────────────────────────
    // LOOP
    // ─────────────────────────────────────

    while(true){
        keyCheck();

        const now=Date.now();
        const money=ns.getServerMoneyAvailable("home");

        const dt=(now-lastTime)/1000;
        const rate=(money-lastMoney)/dt;

        lastMoney=money;
        lastTime=now;

        const servers=scanAll();
        let total=0,used=0;
        for(const s of servers){
            const serv=ns.getServer(s);
            total+=serv.maxRam;
            used+=serv.ramUsed;
        }

        const stocks = ns.stock.hasTIXAPIAccess()?0:0;
        let networth=money+stocks;

        if(ns.corporation?.hasCorporation?.())
            networth+=ns.corporation.getCorporation().funds;

        const ramPct=(used/total*100)||0;

        ns.clearLog();

        ns.print("══════════════════════════════════════");
        ns.print(" DASHBOARD V5  |  1-6 change screen");
        ns.print("══════════════════════════════════════");

        switch(tab){
            case 1: screenOverview(rate,networth,ramPct); break;
            case 2: screenNetwork(); break;
            case 3: screenTargets(); break;
            case 4: screenHacknet(); break;
            case 5: screenGang(); break;
            case 6: screenCorp(); break;
        }

        await ns.sleep(500);
    }
}
