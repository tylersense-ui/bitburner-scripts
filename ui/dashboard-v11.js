/** @param {NS} ns **/
export async function main(ns){

    ns.disableLog("ALL");
    ns.tail();
    ns.resizeTail(880,600);

    const fmt=n=>ns.formatNumber(n,2);

    let tab=1;

    let lastMoney=ns.getServerMoneyAvailable("home");

    const moneyHist=[], ramHist=[], hacknetHist=[];

    while(true){

        /* ========= INPUT ========= */

        const k=ns.getInput?.();

        if(k==="0") tab=10;
        else if(k==="-") tab=11;
        else if(k==="=") tab=12;
        else if(k==="[") tab=13;
        else if(k==="]") tab=14;
        else if(k==="\\") tab=15;
        else if(k===";") tab=16;
        else if(k=="'") tab=17;
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

        ns.print("=".repeat(90));

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
            case 16: insights(servers,used,total); break;
            case 17: topScripts(); break;
        }

        await ns.sleep(1000);
    }

    /* ================================================= */

    function trim(a){ if(a.length>60) a.shift(); }

    function scanAll(){
        const seen=new Set(["home"]);
        const stack=["home"];
        while(stack.length){
            const s=stack.pop();
            for(const n of ns.scan(s))
                if(!seen.has(n)){ seen.add(n); stack.push(n); }
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
        ns.print("DASHBOARD V11 | 1-9 0 - = [ ] \\ ; insights  ' scripts");
    }

    function globalBar(servers,hist){

        let total=0,used=0;

        for(const s of servers){
            total+=ns.getServerMaxRam(s);
            used+=ns.getServerUsedRam(s);
        }

        const avg=hist.reduce((a,b)=>a+b,0)/Math.max(hist.length,1);

        ns.print(
            "💰 "+fmt(ns.getServerMoneyAvailable("home"))+
            "  Δ "+fmt(avg)+"/s"+
            "  RAM "+(used/total*100).toFixed(0)+"%"+
            "  ⚡ "+fmt(hacknetProd())
        );
    }

    /* ================= INSIGHTS ================= */

    function insights(servers,used,total){

        ns.print("\nINSIGHTS++\n");

        const money=ns.getServerMoneyAvailable("home");

        /* hacknet roi */
        const prod=hacknetProd();
        const cost=ns.hacknet.getPurchaseNodeCost();
        const roi=cost/prod;

        if(roi<600) ns.print("✓ Buy Hacknet (ROI "+(roi/60).toFixed(1)+"m)");

        /* server roi */
        const max=ns.getPurchasedServerMaxRam();
        const scost=ns.getPurchasedServerCost(max);

        if(money>scost)
            ns.print("✓ Buy server "+max+"GB");

        /* ram saturation */
        if(used/total>0.9)
            ns.print("⚠ RAM saturated");

        /* bladeburner stamina */
        if(ns.bladeburner?.inBladeburner?.()){
            const [c,m]=ns.bladeburner.getStamina();
            if(c/m<0.4)
                ns.print("⚠ Bladeburner stamina low → Field Analysis");
        }

        /* augs */
        const owned=ns.getOwnedAugmentations(true).length -
                    ns.getOwnedAugmentations().length;

        if(owned>3)
            ns.print("✓ Consider install ("+owned+" queued)");
    }

    /* ================= TOP SCRIPTS ================= */

    function topScripts(){

        const procs=ns.ps();

        const list=procs.map(p=>({
            name:p.filename,
            ram:p.threads*ns.getScriptRam(p.filename)
        }))
        .sort((a,b)=>b.ram-a.ram)
        .slice(0,10);

        ns.print("\nTOP RAM SCRIPTS\n");

        for(const s of list)
            ns.print(s.name.padEnd(25)+fmt(s.ram));
    }

    /* ================= BASIC TABS ================= */

    function overview(){ ns.print("Overview"); }
    function network(){ ns.print("Network"); }
    function targets(){ ns.print("Targets"); }
    function hacknet(){ ns.print("Hacknet"); }
    function gang(){ ns.print("Gang"); }
    function corp(){ ns.print("Corp"); }
    function processes(){ ns.print("Processes"); }
    function blade(){ ns.print("Bladeburner"); }
    function stocks(){ ns.print("Stocks"); }

    function serversTab(){
        ns.print("\nSERVERS++");
        const max=ns.getPurchasedServerMaxRam();
        ns.print("Max RAM "+max);
    }

    function augs(){
        ns.print("\nAUGMENTS++");
        ns.print("Installed "+ns.getOwnedAugmentations().length);
    }

    /* ================= GRAPH ================= */

    function graph(arr,title){

        ns.print("\n"+title);

        const max=Math.max(...arr.map(Math.abs),1);

        for(const v of arr){
            const bars=Math.floor(Math.abs(v)/max*35);
            ns.print((v>=0?"█":"░").repeat(bars));
        }
    }
}
