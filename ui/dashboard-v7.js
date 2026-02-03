/** @param {NS} ns **/
export async function main(ns){

    ns.disableLog("ALL");
    ns.tail();
    ns.resizeTail(620,460);

    let tab=1;

    let lastMoney = ns.getServerMoneyAvailable("home");
    const history=[];

    const fmt = n=>ns.formatNumber(n,2);

    while(true){

        const key = ns.getInput?.();
        if(key==="0") tab=10;
        else if(key>="1"&&key<="9") tab=Number(key);

        ns.clearLog();
        header();

        switch(tab){
            case 1: overview(); break;
            case 2: network(); break;
            case 3: targets(); break;
            case 4: hacknet(); break;
            case 5: gang(); break;
            case 6: corp(); break;
            case 7: processes(); break;
            case 8: bladeburner(); break;
            case 9: stocks(); break;
            case 10: profit(); break;
        }

        await ns.sleep(1000);
    }

    /* ================= HEADER ================= */

    function header(){
        ns.print("\x1b[32mDASHBOARD V7 | 1-9 tabs | 0 profit\x1b[0m");
        ns.print("=".repeat(55));
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

    /* ================= 1 OVERVIEW ================= */

    function overview(){
        ns.print("OVERVIEW\n");

        ns.print("Money : "+fmt(ns.getServerMoneyAvailable("home")));
        ns.print("Hack  : "+ns.getHackingLevel());
        ns.print("Karma : "+ns.heart.break().toFixed(1));
        ns.print("Time  : "+ns.tFormat(ns.getTimeSinceLastAug()));
    }

    /* ================= 2 NETWORK ================= */

    function network(){
        const servers=scanAll();

        let total=0, used=0, rooted=0;

        for(const s of servers){
            total+=ns.getServerMaxRam(s);
            used+=ns.getServerUsedRam(s);
            if(ns.hasRootAccess(s)) rooted++;
        }

        ns.print("NETWORK\n");
        ns.print("Servers : "+servers.length);
        ns.print("Rooted  : "+rooted);
        ns.print("RAM     : "+fmt(used)+" / "+fmt(total));
        ns.print("Usage   : "+(used/total*100).toFixed(1)+"%");
    }

    /* ================= 3 TARGETS ================= */

    function targets(){

        const list=scanAll()
        .filter(s=>ns.hasRootAccess(s)&&ns.getServerMaxMoney(s)>0)
        .map(s=>({
            s,
            score: ns.getServerMaxMoney(s)/ns.getHackTime(s)
        }))
        .sort((a,b)=>b.score-a.score)
        .slice(0,10);

        ns.print("BEST TARGETS\n");

        for(const t of list)
            ns.print(t.s.padEnd(18)+fmt(t.score));
    }

    /* ================= 4 HACKNET ================= */

    function hacknet(){

        let prod=0;

        for(let i=0;i<ns.hacknet.numNodes();i++)
            prod+=ns.hacknet.getNodeStats(i).production;

        ns.print("HACKNET\n");
        ns.print("Nodes  : "+ns.hacknet.numNodes());
        ns.print("$ / sec: "+fmt(prod));
    }

    /* ================= 5 GANG ================= */

    function gang(){
        if(!ns.gang.inGang()){
            ns.print("Not in gang");
            return;
        }

        const g=ns.gang.getGangInformation();

        ns.print("GANG\n");
        ns.print("Money/s : "+fmt(g.moneyGainRate*5));
        ns.print("Respect : "+fmt(g.respect));
        ns.print("Wanted  : "+fmt(g.wantedLevel));
    }

    /* ================= 6 CORP ================= */

    function corp(){
        if(!ns.corporation?.hasCorporation?.()){
            ns.print("No corp");
            return;
        }

        const c=ns.corporation.getCorporation();

        ns.print("CORP\n");
        ns.print("Funds   : "+fmt(c.funds));
        ns.print("Profit  : "+fmt(c.revenue-c.expenses));
    }

    /* ================= 7 PROCESSES ================= */

    function processes(){
        ns.print("PROCESSES\n");
        for(const p of ns.ps())
            ns.print(p.filename+" x"+p.threads);
    }

    /* ================= 8 BLADEBURNER++ ================= */

    function bladeburner(){

        if(!ns.bladeburner?.inBladeburner?.()){
            ns.print("Not in Bladeburner");
            return;
        }

        const bb=ns.bladeburner;

        const [cur,max]=bb.getStamina();
        const chaos=bb.getCityChaos(bb.getCity());

        ns.print("BLADEBURNER++\n");

        ns.print("Rank    : "+fmt(bb.getRank()));
        ns.print("Stamina : "+(cur/max*100).toFixed(1)+"%");
        ns.print("Chaos   : "+chaos.toFixed(1));

        if(cur/max<0.4) ns.print("→ Train");
        if(chaos>50) ns.print("→ Diplomacy");
    }

    /* ================= 9 STOCKS ================= */

    function stocks(){

        if(!ns.stock.hasTIXAPIAccess()){
            ns.print("No TIX API");
            return;
        }

        let value=0;

        ns.print("STOCKS\n");

        for(const sym of ns.stock.getSymbols()){

            const [long, , avg] = ns.stock.getPosition(sym);
            if(long>0){
                const price = ns.stock.getPrice(sym);
                const val = long*price;
                value+=val;
                ns.print(sym+"  "+fmt(val));
            }
        }

        ns.print("");
        ns.print("Total : "+fmt(value));
    }

    /* ================= 10 PROFIT LIVE ================= */

    function profit(){

        const money=ns.getServerMoneyAvailable("home");
        const diff=money-lastMoney;
        lastMoney=money;

        history.push(diff);
        if(history.length>30) history.shift();

        ns.print("PROFIT LIVE\n");

        ns.print("$/sec : "+fmt(diff));
        ns.print("$/min : "+fmt(diff*60));
        ns.print("");

        const max=Math.max(...history.map(Math.abs),1);

        let graph="";
        for(const v of history){
            const bars=Math.floor(Math.abs(v)/max*10);
            graph += (v>=0?"█":"░").repeat(bars)+"\n";
        }

        ns.print(graph);
    }
}
