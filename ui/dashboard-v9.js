/** @param {NS} ns **/
export async function main(ns){

    ns.disableLog("ALL");
    ns.tail();
    ns.resizeTail(780,560);

    let tab=1;

    const fmt=n=>ns.formatNumber(n,2);

    let lastMoney=ns.getServerMoneyAvailable("home");

    const moneyHist=[];
    const ramHist=[];

    while(true){

        const key=ns.getInput?.();

        if(key==="0") tab=10;
        else if(key==="-") tab=11;
        else if(key==="=") tab=12;
        else if(key==="[") tab=13;
        else if(key==="]") tab=14;
        else if(key>="1"&&key<="9") tab=Number(key);

        const servers=scanAll();

        /* ===== HISTORY UPDATE ===== */

        const money=ns.getServerMoneyAvailable("home");
        moneyHist.push(money-lastMoney);
        if(moneyHist.length>60) moneyHist.shift();
        lastMoney=money;

        let total=0, used=0;
        for(const s of servers){
            total+=ns.getServerMaxRam(s);
            used+=ns.getServerUsedRam(s);
        }

        ramHist.push(used/total);
        if(ramHist.length>60) ramHist.shift();

        /* ===== DRAW ===== */

        ns.clearLog();

        header();
        globalBar(servers,moneyHist);

        ns.print("=".repeat(75));

        switch(tab){
            case 1: overview(); break;
            case 2: network(); break;
            case 3: targets(); break;
            case 4: hacknet(); break;
            case 5: gang(); break;
            case 6: corp(); break;
            case 7: processes(); break;
            case 8: blade(); break;
            case 9: stocks(); break;
            case 10: profit(); break;
            case 11: serversTab(); break;
            case 12: augs(); break;
            case 13: ramGraph(); break;
            case 14: moneyGraph(); break;
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
        ns.print("DASHBOARD V9  | 1-9 0 - = [ ]");
    }

    /* ================= GLOBAL BAR ================= */

    function hacknetProd(){
        let p=0;
        for(let i=0;i<ns.hacknet.numNodes();i++)
            p+=ns.hacknet.getNodeStats(i).production;
        return p;
    }

    function globalBar(servers,hist){

        const money=ns.getServerMoneyAvailable("home");

        let total=0,used=0;
        for(const s of servers){
            total+=ns.getServerMaxRam(s);
            used+=ns.getServerUsedRam(s);
        }

        const avg=hist.reduce((a,b)=>a+b,0)/Math.max(hist.length,1);

        ns.print(
            "💰 "+fmt(money)+
            "  Δ "+fmt(avg)+"/s" +
            "  RAM "+(used/total*100).toFixed(0)+"%" +
            "  ⚡ "+fmt(hacknetProd())
        );
    }

    /* ================= OVERVIEW ================= */

    function overview(){
        ns.print("\nOVERVIEW\n");
        ns.print("Hack   : "+ns.getHackingLevel());
        ns.print("Karma  : "+ns.heart.break().toFixed(1));
        ns.print("Time   : "+ns.tFormat(ns.getTimeSinceLastAug()));
    }

    /* ================= NETWORK++ ================= */

    function network(){

        const servers=scanAll();

        let idle=0;

        for(const s of servers)
            if(ns.getServerUsedRam(s)===0) idle++;

        ns.print("\nNETWORK++\n");
        ns.print("Idle servers : "+idle);
    }

    /* ================= TARGETS ================= */

    function targets(){
        ns.print("\nTARGETS\n");
    }

    /* ================= HACKNET++ ================= */

    function hacknet(){

        const prod=hacknetProd();

        const next=ns.hacknet.getPurchaseNodeCost();

        const roi= next>0 ? next/prod : 0;

        ns.print("\nHACKNET++\n");
        ns.print("Prod   : "+fmt(prod));
        ns.print("Next $ : "+fmt(next));
        ns.print("ROI s  : "+roi.toFixed(1));

        if(roi<600) ns.print("✓ BUY");
    }

    /* ================= GANG ================= */

    function gang(){
        if(!ns.gang.inGang()){
            ns.print("No gang");
            return;
        }
        const g=ns.gang.getGangInformation();
        ns.print("\nGANG\n"+fmt(g.moneyGainRate*5)+"/s");
    }

    /* ================= CORP ================= */

    function corp(){
        if(!ns.corporation?.hasCorporation?.()){
            ns.print("No corp");
            return;
        }
        const c=ns.corporation.getCorporation();
        ns.print("\nCORP\nProfit "+fmt(c.revenue-c.expenses));
    }

    /* ================= PROCESSES ================= */

    function processes(){
        ns.print("\nPROCESSES\n");
        for(const p of ns.ps())
            ns.print(p.filename+" x"+p.threads);
    }

    /* ================= BLADEBURNER++ ================= */

    function blade(){
        if(!ns.bladeburner?.inBladeburner?.()){
            ns.print("No Bladeburner");
            return;
        }

        const [cur,max]=ns.bladeburner.getStamina();

        ns.print("\nBLADEBURNER++\n");
        ns.print("Stamina "+(cur/max*100).toFixed(1)+"%");
    }

    /* ================= STOCKS ================= */

    function stocks(){
        ns.print("\nSTOCKS\n");
    }

    /* ================= PROFIT GRAPH ================= */

    function profit(){
        ns.print("\nPROFIT\n");
        drawGraph(moneyHist,25);
    }

    /* ================= SERVERS++ ================= */

    function serversTab(){

        const max=ns.getPurchasedServerMaxRam();
        const cost=ns.getPurchasedServerCost(max);

        ns.print("\nSERVERS++\n");
        ns.print("Max RAM : "+max);
        ns.print("Cost    : "+fmt(cost));
    }

    /* ================= AUGS ================= */

    function augs(){
        ns.print("\nAUGS\n");
        ns.print(ns.getOwnedAugmentations().length+" installed");
    }

    /* ================= RAM GRAPH ================= */

    function ramGraph(){
        ns.print("\nRAM GRAPH\n");
        drawGraph(ramHist.map(x=>x*100),20);
    }

    /* ================= MONEY GRAPH ================= */

    function moneyGraph(){
        ns.print("\nMONEY GRAPH\n");
        drawGraph(moneyHist,20);
    }

    /* ================= GRAPH UTIL ================= */

    function drawGraph(arr,height){

        const max=Math.max(...arr.map(Math.abs),1);

        for(const v of arr){
            const bars=Math.floor(Math.abs(v)/max*height);
            ns.print((v>=0?"█":"░").repeat(bars));
        }
    }
}
