/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("ALL");
    ns.tail();
    ns.resizeTail(560, 420);

    let tab = 1;

    while(true){

        // key handling
        const key = ns.getInput?.();
        if(key && key >= "1" && key <= "8") tab = Number(key);

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
            case 8: bladeburnerTab(); break;
        }

        await ns.sleep(500);
    }

    /* ============================= */
    /* HEADER */
    /* ============================= */

    function header(){
        ns.print("\x1b[32mDASHBOARD V6  |  keys 1-8 switch tabs\x1b[0m");
        ns.print("=".repeat(50));
    }

    const fmt = (n)=>ns.formatNumber(n,2);

    /* ============================= */
    /* TAB 1 OVERVIEW */
    /* ============================= */

    function overview(){
        ns.print("\x1b[36mOVERVIEW\x1b[0m");

        ns.print("Money  : "+fmt(ns.getServerMoneyAvailable("home")));
        ns.print("Hack   : "+ns.getHackingLevel());
        ns.print("Karma  : "+ns.heart.break().toFixed(1));
    }

    /* ============================= */
    /* TAB 2 NETWORK */
    /* ============================= */

    function network(){

        ns.print("\x1b[36mNETWORK\x1b[0m");

        const servers = scanAll();
        let ram=0, used=0;

        for(const s of servers){
            ram += ns.getServerMaxRam(s);
            used += ns.getServerUsedRam(s);
        }

        ns.print("Servers : "+servers.length);
        ns.print("RAM     : "+fmt(used)+" / "+fmt(ram));
    }

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

    /* ============================= */
    /* TAB 3 TARGETS */
    /* ============================= */

    function targets(){
        ns.print("\x1b[36mTARGETS\x1b[0m");

        const servers = scanAll()
            .filter(s=>ns.hasRootAccess(s) && ns.getServerMaxMoney(s)>0);

        servers.sort((a,b)=>
            ns.getServerMaxMoney(b)-ns.getServerMaxMoney(a));

        for(const s of servers.slice(0,10)){
            ns.print(
                s.padEnd(18)+
                fmt(ns.getServerMaxMoney(s))
            );
        }
    }

    /* ============================= */
    /* TAB 4 HACKNET */
    /* ============================= */

    function hacknet(){

        ns.print("\x1b[36mHACKNET\x1b[0m");

        const n = ns.hacknet.numNodes();

        let prod=0;

        for(let i=0;i<n;i++)
            prod += ns.hacknet.getNodeStats(i).production;

        ns.print("Nodes  : "+n);
        ns.print("$ / sec: "+fmt(prod));
    }

    /* ============================= */
    /* TAB 5 GANG */
    /* ============================= */

    function gang(){

        if(!ns.gang.inGang()){
            ns.print("Not in gang");
            return;
        }

        const info = ns.gang.getGangInformation();

        ns.print("\x1b[36mGANG\x1b[0m");
        ns.print("Money/s : "+fmt(info.moneyGainRate*5));
        ns.print("Respect : "+fmt(info.respect));
        ns.print("Wanted  : "+fmt(info.wantedLevel));
    }

    /* ============================= */
    /* TAB 6 CORP */
    /* ============================= */

    function corp(){

        if(!ns.corporation?.hasCorporation?.()){
            ns.print("No corporation");
            return;
        }

        const c = ns.corporation.getCorporation();

        ns.print("\x1b[36mCORP\x1b[0m");
        ns.print("Funds   : "+fmt(c.funds));
        ns.print("Revenue : "+fmt(c.revenue));
        ns.print("Expenses: "+fmt(c.expenses));
        ns.print("Profit  : "+fmt(c.revenue-c.expenses));
    }

    /* ============================= */
    /* TAB 7 PROCESSES */
    /* ============================= */

    function processes(){

        ns.print("\x1b[36mPROCESSES\x1b[0m");

        for(const p of ns.ps("home")){
            ns.print(p.filename+"  x"+p.threads);
        }
    }

    /* ============================= */
    /* TAB 8 BLADEBURNER++ */
    /* ============================= */

    function bladeburnerTab(){

        if(!ns.bladeburner?.inBladeburner?.()){
            ns.print("Not in Bladeburner");
            return;
        }

        const bb = ns.bladeburner;

        ns.print("\x1b[35mBLADEBURNER++\x1b[0m");

        const city = bb.getCity();
        const chaos = bb.getCityChaos(city);

        const [cur,max] = bb.getStamina();
        const stamPct = cur/max;

        const rank = bb.getRank();
        const sp = bb.getSkillPoints();

        ns.print("Rank      : "+fmt(rank));
        ns.print("Skill pts : "+fmt(sp));
        ns.print("City      : "+city);
        ns.print("Chaos     : "+chaos.toFixed(1));
        ns.print("Stamina   : "+(stamPct*100).toFixed(1)+"%");
        ns.print("");

        let best=null;

        for(const type of ["Contracts","Operations"]){
            for(const name of bb.getActionNames(type)){

                const [min,max] = bb.getActionEstimatedSuccessChance(type,name);
                const chance=(min+max)/2;
                if(chance<0.75) continue;

                const rep = bb.getActionRepGain(type,name);
                const time = bb.getActionTime(type,name);

                const score = rep/time;

                if(!best || score>best.score)
                    best={type,name,score,chance};
            }
        }

        if(best){
            ns.print("Best REP/s → "+best.type+"/"+best.name);
        }

        if(stamPct<0.4) ns.print("⚠ Train stamina");
        if(chaos>50) ns.print("⚠ Diplomacy");

        const black = bb.getActionNames("BlackOps")
            .find(b=>bb.getActionCountRemaining("BlackOps",b)>0);

        if(black){
            ns.print("Next BlackOp: "+black);
        }
    }
}
