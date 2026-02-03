/** @param {NS} ns **/
export async function main(ns){

    ns.disableLog("ALL");
    ns.tail();
    ns.resizeTail(820,580);

    const fmt=n=>ns.formatNumber(n,2);

    let tab=1;

    let lastMoney=ns.getServerMoneyAvailable("home");

    const moneyHist=[];
    const ramHist=[];
    const hacknetHist=[];

    while(true){

        /* ========= KEY HANDLING ========= */

        const k=ns.getInput?.();

        if(k==="0") tab=10;
        else if(k==="-") tab=11;
        else if(k==="=") tab=12;
        else if(k==="[") tab=13;
        else if(k==="]") tab=14;
        else if(k==="\\") tab=15;
        else if(k>="1"&&k<="9") tab=Number(k);

        const servers=scanAll();

        /* ========= HISTORY ========= */

        const money=ns.getServerMoneyAvailable("home");
        moneyHist.push(money-lastMoney);
        lastMoney=money;

        let total=0, used=0;
        for(const s of servers){
            total+=ns.getServerMaxRam(s);
            used+=ns.getServerUsedRam(s);
        }

        ramHist.push(used/total);
        hacknetHist.push(hacknetProd());

        trim(moneyHist); trim(ramHist); trim(hacknetHist);

        /* ========= DRAW ========= */

        ns.clearLog();

        header();
        globalBar(servers,moneyHist);

        ns.print("=".repeat(80));

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
            case 10: graph(moneyHist,"PROFIT"); break;
            case 11: serversTab(); break;
            case 12: augs(); break;
            case 13: graph(ramHist.map(x=>x*100),"RAM %"); break;
            case 14: graph(moneyHist,"MONEY Δ"); break;
            case 15: graph(hacknetHist,"HACKNET"); break;
        }

        await ns.sleep(1000);
    }

    /* ================= HELPERS ================= */

    function trim(a){ if(a.length>60) a.shift(); }

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

    function hacknetProd(){
        let p=0;
        for(let i=0;i<ns.hacknet.numNodes();i++)
            p+=ns.hacknet.getNodeStats(i).production;
        return p;
    }

    /* ================= HEADER ================= */

    function header(){
        ns.print("DASHBOARD V10 | 1-9 0 - = [ ] \\");
    }

    function globalBar(servers,hist){

        let total=0,used=0;

        for(const s of servers){
            total+=ns.getServerMaxRam(s);
            used+=ns.getServerUsedRam(s);
        }

        const avg=hist.reduce((a,b)=>a+b,0)/Math.max(hist.length,1);

        let stam="--";
        if(ns.bladeburner?.inBladeburner?.()){
            const [c,m]=ns.bladeburner.getStamina();
            stam=((c/m)*100).toFixed(0);
        }

        ns.print(
            "💰 "+fmt(ns.getServerMoneyAvailable("home"))+
            "  Δ "+fmt(avg)+"/s"+
            "  RAM "+(used/total*100).toFixed(0)+"%"+
            "  ⚡ "+fmt(hacknetProd())+
            "  ⚔ "+stam+"%"
        );
    }

    /* ================= TABS ================= */

    function overview(){
        ns.print("\nOVERVIEW");
        ns.print("Hack  "+ns.getHackingLevel());
        ns.print("Karma "+ns.heart.break().toFixed(1));
        ns.print("Time  "+ns.tFormat(ns.getTimeSinceLastAug()));
    }

    function network(){
        const s=scanAll();
        const idle=s.filter(x=>ns.getServerUsedRam(x)===0).length;
        ns.print("\nNETWORK++");
        ns.print("Idle servers : "+idle);
    }

    function targets(){

        const list=scanAll()
        .filter(s=>ns.hasRootAccess(s)&&ns.getServerMaxMoney(s)>0)
        .map(s=>({
            s,
            score: ns.getServerMaxMoney(s)/ns.getHackTime(s)
        }))
        .sort((a,b)=>b.score-a.score)
        .slice(0,10);

        ns.print("\nTARGETS++");
        for(const t of list)
            ns.print(t.s.padEnd(18)+fmt(t.score));
    }

    function hacknet(){

        const prod=hacknetProd();
        const cost=ns.hacknet.getPurchaseNodeCost();
        const roi= cost>0 ? cost/prod : 0;

        ns.print("\nHACKNET++");
        ns.print("Prod : "+fmt(prod));
        ns.print("ROI  : "+roi.toFixed(0)+"s");

        if(roi<600) ns.print("✓ BUY");
    }

    function gang(){
        if(!ns.gang.inGang()){
            ns.print("No gang"); return;
        }
        const g=ns.gang.getGangInformation();
        ns.print("\nGANG "+fmt(g.moneyGainRate*5)+"/s");
    }

    function corp(){
        if(!ns.corporation?.hasCorporation?.()){
            ns.print("No corp"); return;
        }
        const c=ns.corporation.getCorporation();
        ns.print("\nCORP "+fmt(c.revenue-c.expenses));
    }

    function processes(){
        ns.print("\nPROCESSES");
        for(const p of ns.ps())
            ns.print(p.filename+" x"+p.threads);
    }

    function blade(){
        if(!ns.bladeburner?.inBladeburner?.()){
            ns.print("No Bladeburner"); return;
        }

        const [cur,max]=ns.bladeburner.getStamina();
        const chaos=ns.bladeburner.getCityChaos(ns.bladeburner.getCity());

        ns.print("\nBLADEBURNER++");
        ns.print("Stam  "+(cur/max*100).toFixed(1)+"%");
        ns.print("Chaos "+chaos.toFixed(1));
    }

    function stocks(){
        ns.print("\nSTOCKS (monitor only)");
    }

    function serversTab(){

        const max=ns.getPurchasedServerMaxRam();
        const cost=ns.getPurchasedServerCost(max);
        const can=Math.floor(ns.getServerMoneyAvailable("home")/cost);

        ns.print("\nSERVERS++");
        ns.print("Max RAM : "+max);
        ns.print("Can buy : "+can);
    }

    function augs(){
        ns.print("\nAUGMENTS++");
        ns.print("Installed : "+ns.getOwnedAugmentations().length);
        ns.print("Queued    : "+ns.getOwnedAugmentations(true).length);
    }

    /* ================= GRAPH ================= */

    function graph(arr,title){

        ns.print("\n"+title);

        const max=Math.max(...arr.map(Math.abs),1);

        for(const v of arr){
            const bars=Math.floor(Math.abs(v)/max*30);
            ns.print((v>=0?"█":"░").repeat(bars));
        }
    }
}
