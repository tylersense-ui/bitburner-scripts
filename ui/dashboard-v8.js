/** @param {NS} ns **/
export async function main(ns){

    ns.disableLog("ALL");
    ns.tail();
    ns.resizeTail(720,520);

    let tab=1;

    const fmt = n=>ns.formatNumber(n,2);

    let lastMoney=ns.getServerMoneyAvailable("home");
    const history=[];

    while(true){

        const key = ns.getInput?.();
        if(key==="0") tab=10;
        else if(key==="-" ) tab=11;
        else if(key==="=" ) tab=12;
        else if(key>="1"&&key<="9") tab=Number(key);

        const servers = scanAll();

        ns.clearLog();

        header();
        globalBar(servers);

        ns.print("=".repeat(70));

        switch(tab){
            case 1: overview(); break;
            case 2: network(servers); break;
            case 3: targets(servers); break;
            case 4: hacknet(); break;
            case 5: gang(); break;
            case 6: corp(); break;
            case 7: processes(); break;
            case 8: bladeburner(); break;
            case 9: stocks(); break;
            case 10: profit(); break;
            case 11: serversTab(); break;
            case 12: augments(); break;
        }

        await ns.sleep(1000);
    }

    /* ================= SCAN ================= */

    function scanAll(){
        const seen=new Set(["home"]);
        const stack=["home"];
        while(stack.length){
            const s=stack.pop();
            for(const n of ns.scan(s)){
                if(!seen.has(n)){
                    seen.add(n);
                    stack.push(n);
                }
            }
        }
        return [...seen];
    }

    /* ================= HEADER ================= */

    function header(){
        ns.print("DASHBOARD V8  |  1-9 | 0 | - | =");
    }

    /* ================= GLOBAL BAR ================= */

    function globalBar(servers){

        let total=0, used=0;

        for(const s of servers){
            total+=ns.getServerMaxRam(s);
            used+=ns.getServerUsedRam(s);
        }

        const money=ns.getServerMoneyAvailable("home");

        ns.print(
            "💰 "+fmt(money)+
            "   RAM "+(used/total*100).toFixed(0)+"%" +
            "   ⚡ "+fmt(hacknetProd())+"/s"
        );
    }

    function hacknetProd(){
        let p=0;
        for(let i=0;i<ns.hacknet.numNodes();i++)
            p+=ns.hacknet.getNodeStats(i).production;
        return p;
    }

    /* ================= 1 OVERVIEW ================= */

    function overview(){
        ns.print("\nOVERVIEW\n");
        ns.print("Hack   : "+ns.getHackingLevel());
        ns.print("Karma  : "+ns.heart.break().toFixed(1));
        ns.print("Time   : "+ns.tFormat(ns.getTimeSinceLastAug()));
    }

    /* ================= 2 NETWORK ================= */

    function network(servers){

        let rooted=0;

        for(const s of servers)
            if(ns.hasRootAccess(s)) rooted++;

        ns.print("\nNETWORK\n");
        ns.print("Servers : "+servers.length);
        ns.print("Rooted  : "+rooted);
    }

    /* ================= 3 TARGETS ================= */

    function targets(servers){

        const best = servers
        .filter(s=>ns.hasRootAccess(s)&&ns.getServerMaxMoney(s)>0)
        .map(s=>({
            s,
            score: ns.getServerMaxMoney(s)/ns.getHackTime(s)
        }))
        .sort((a,b)=>b.score-a.score)
        .slice(0,8);

        ns.print("\nBEST TARGETS\n");

        for(const t of best)
            ns.print(t.s.padEnd(18)+fmt(t.score));
    }

    /* ================= 4 HACKNET ================= */

    function hacknet(){
        ns.print("\nHACKNET\n");
        ns.print("Nodes  : "+ns.hacknet.numNodes());
        ns.print("$ / sec: "+fmt(hacknetProd()));
    }

    /* ================= 5 GANG ================= */

    function gang(){
        if(!ns.gang.inGang()){
            ns.print("Not in gang");
            return;
        }

        const g=ns.gang.getGangInformation();

        ns.print("\nGANG\n");
        ns.print("Money/s : "+fmt(g.moneyGainRate*5));
        ns.print("Respect : "+fmt(g.respect));
    }

    /* ================= 6 CORP ================= */

    function corp(){
        if(!ns.corporation?.hasCorporation?.()){
            ns.print("No corp");
            return;
        }

        const c=ns.corporation.getCorporation();

        ns.print("\nCORP\n");
        ns.print("Funds  : "+fmt(c.funds));
        ns.print("Profit : "+fmt(c.revenue-c.expenses));
    }

    /* ================= 7 PROCESSES ================= */

    function processes(){
        ns.print("\nPROCESSES\n");
        for(const p of ns.ps())
            ns.print(p.filename+" x"+p.threads);
    }

    /* ================= 8 BLADEBURNER ================= */

    function bladeburner(){

        if(!ns.bladeburner?.inBladeburner?.()){
            ns.print("Not in Bladeburner");
            return;
        }

        const bb=ns.bladeburner;
        const [cur,max]=bb.getStamina();

        ns.print("\nBLADEBURNER++\n");
        ns.print("Rank : "+fmt(bb.getRank()));
        ns.print("Stam : "+(cur/max*100).toFixed(1)+"%");
        ns.print("Chaos: "+bb.getCityChaos(bb.getCity()).toFixed(1));
    }

    /* ================= 9 STOCKS ================= */

    function stocks(){

        if(!ns.stock.hasTIXAPIAccess()){
            ns.print("No TIX API");
            return;
        }

        let total=0;

        ns.print("\nSTOCKS\n");

        for(const s of ns.stock.getSymbols()){
            const [sh] = ns.stock.getPosition(s);
            if(sh>0){
                const v=sh*ns.stock.getPrice(s);
                total+=v;
                ns.print(s+" "+fmt(v));
            }
        }

        ns.print("Total: "+fmt(total));
    }

    /* ================= 10 PROFIT ================= */

    function profit(){

        const money=ns.getServerMoneyAvailable("home");
        const diff=money-lastMoney;
        lastMoney=money;

        history.push(diff);
        if(history.length>40) history.shift();

        const avg = history.reduce((a,b)=>a+b,0)/history.length;

        ns.print("\nPROFIT LIVE\n");
        ns.print("$/s  : "+fmt(avg));

        const max=Math.max(...history.map(Math.abs),1);

        for(const v of history){
            const bars=Math.floor(Math.abs(v)/max*20);
            ns.print((v>0?"█":"░").repeat(bars));
        }
    }

    /* ================= 11 SERVERS ================= */

    function serversTab(){

        ns.print("\nSERVERS\n");

        const purchased=ns.getPurchasedServers();

        ns.print("Owned : "+purchased.length);

        const cost=ns.getPurchasedServerCost(64);
        ns.print("64GB cost : "+fmt(cost));
    }

    /* ================= 12 AUGMENTS ================= */

    function augments(){

        ns.print("\nAUGMENTS\n");

        ns.print("Installed : "+ns.getOwnedAugmentations().length);
        ns.print("Queued    : "+ns.getOwnedAugmentations(true).length);
        ns.print("Since aug : "+ns.tFormat(ns.getTimeSinceLastAug()));
    }
}
