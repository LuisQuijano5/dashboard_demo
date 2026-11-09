const CLIENT_TODAY = new Date("2026-11-09T00:00:00Z");

const contractStart = new Date("2026-01-01T00:00:00Z");
const contractEnd = new Date("2027-12-31T23:59:59Z"); 
const totalAssets = 85;
const requiredFrequencies = 170; 
let coveredFrequencies = 145; 

let clientAppointments = [];
let clientFindings = [];

function generateClientData() {
    for (let i = 0; i < 200; i++) {
        const rDate = new Date(contractStart.getTime() + (Math.random() * (contractEnd.getTime() - contractStart.getTime())));
        const isPast = rDate < CLIENT_TODAY;
        const stat = isPast ? (Math.random() > 0.1 ? "DONE" : "PENDING") : (Math.random() > 0.3 ? "CONFIRMED" : "PENDING");
        
        let srvs = [];
        const numSrvs = Math.floor(Math.random() * 3) + 1;
        for(let s=0; s<numSrvs; s++) {
            srvs.push({
                type: "maintenance",
                frequency: Math.random() < 0.08 ? "ANUAL" : "mensual"
            });
        }
        clientAppointments.push({ date: rDate, status: stat, services: srvs });

        if(i % 4 === 0 && isPast) { 
            const fDate = new Date(rDate.getTime() - (Math.random() * 20) * 24*60*60*1000); 
            const isClosed = Math.random() > 0.3;
            clientFindings.push({
                severity: Math.random() < 0.15 ? "DEACTIVATION" : "NORMAL",
                reportDate: fDate,
                status: isClosed ? "CLOSED" : "OPENED",
                closedDate: isClosed ? rDate : null
            });
        }
    }
    clientAppointments.sort((a,b) => a.date - b.date);
    clientFindings.sort((a,b) => a.reportDate - b.reportDate);
}

function renderClientKPIsAndLists() {
    const totalDuration = contractEnd - contractStart;
    const elapsed = CLIENT_TODAY - contractStart;
    const contractPct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    document.getElementById('kpi-contract-date').innerText = "31 Dic 2027";
    document.getElementById('kpi-contract-pct').innerText = `${Math.round(contractPct)}% Transcurrido`;
    document.getElementById('kpi-contract-bar').style.width = `${contractPct}%`;

    const visitsThisYear = clientAppointments.filter(a => a.status === "DONE" && a.date.getFullYear() === CLIENT_TODAY.getFullYear()).length;
    const visitsEl = document.getElementById('kpi-client-visits');
    const statusEl = document.getElementById('kpi-visits-status');
    visitsEl.innerText = visitsThisYear;
    
    if (visitsThisYear >= 24) {
        visitsEl.style.color = "#dc3545"; statusEl.innerText = "Estado: Excedente";
    } else if (visitsThisYear >= 12) {
        visitsEl.style.color = "#28a745"; statusEl.innerText = "Estado: En rango";
    } else {
        visitsEl.style.color = "#ffc107"; statusEl.innerText = "Estado: Menor";
    }

    document.getElementById('kpi-assets-total').innerText = totalAssets;
    document.getElementById('kpi-freq-total').innerText = requiredFrequencies;
    document.getElementById('kpi-freq-covered').innerText = coveredFrequencies;
    const covPct = (coveredFrequencies / requiredFrequencies) * 100;
    document.getElementById('kpi-asset-pct').innerText = `${Math.round(covPct)}% Cobertura`;
    document.getElementById('kpi-asset-bar').style.width = `${covPct}%`;
    document.getElementById('kpi-asset-bar').style.backgroundColor = covPct > 80 ? "#28a745" : "#FF7322";

    const upcomingList = document.getElementById('client-upcoming-list');
    const recsList = document.getElementById('client-recommendations-list');
    const achievesList = document.getElementById('client-achievements-list');

    const futureAppts = clientAppointments.filter(a => a.date > CLIENT_TODAY && a.status === "CONFIRMED").slice(0, 5);
    futureAppts.forEach(a => {
        const hasAnual = a.services.some(s => s.frequency === "ANUAL");
        upcomingList.innerHTML += `
            <div class="list-item">
                <div class="item-title">${a.date.toISOString().split('T')[0]} - Mantenimiento</div>
                ${hasAnual ? '<span class="badge badge-highlight">Incluye Servicio Anual</span>' : ''}
            </div>
        `;
    });

    recsList.innerHTML = `
        <div class="list-item">
            <span class="badge badge-warning">Frecuencia Faltante</span>
            <div class="item-title">Programar Servicio ANUAL</div>
            <div style="font-size:11px;">Faltan 2 equipos (Cuarto de Bombas) por recibir servicio anual este ciclo.</div>
        </div>
        <div class="list-item">
            <span class="badge badge-danger">Hallazgo Crítico</span>
            <div class="item-title">Revisión de Estaciones Manuales</div>
            <div style="font-size:11px;">Recomendamos agendar revisión pronto para evitar deactivaciones.</div>
        </div>
    `;

    const closedDeacts = clientFindings.filter(f => f.severity === "DEACTIVATION" && f.status === "CLOSED").length;
    const hasAnualDone = clientAppointments.some(a => a.status === "DONE" && a.services.some(s => s.frequency === "ANUAL"));
    
    achievesList.innerHTML = `
        <div class="list-item">
            <span class="badge badge-success">Racha Activa</span>
            <div class="item-title">6 Meses sin Interrupciones</div>
            <div style="font-size:11px;">Servicios mensuales cumplidos al 100%.</div>
        </div>
    `;
    if (closedDeacts > 0) {
        achievesList.innerHTML += `
            <div class="list-item">
                <span class="badge badge-success">Riesgo Mitigado</span>
                <div class="item-title">${closedDeacts} Alerta(s) de DEACTIVATION Resueltas</div>
                <div style="font-size:11px;">Sistema operando sin riesgos inminentes.</div>
            </div>`;
    }
    if (hasAnualDone) {
        achievesList.innerHTML += `
            <div class="list-item">
                <span class="badge badge-success">Servicio Mayor</span>
                <div class="item-title">Mantenimiento ANUAL Completado</div>
            </div>`;
    }
}

function renderClientBurndown() {
    const container = d3.select("#client-chart1-container");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = container.append("svg").attr("width", width).attr("height", height);
    let tooltip = d3.select("body").select(".d3-tooltip");

    let events = [];
    clientFindings.forEach(f => {
        events.push({ date: f.reportDate, type: 'OPEN', severity: f.severity });
        if(f.status === "CLOSED" && f.closedDate) {
            events.push({ date: f.closedDate, type: 'CLOSE', severity: f.severity });
        }
    });
    events.sort((a,b) => a.date - b.date);

    let activeCount = 0;
    let data = [];
    events.forEach(e => {
        activeCount += (e.type === 'OPEN' ? 1 : -1);
        data.push({
            date: e.date,
            count: activeCount,
            event: e.type,
            severity: e.severity
        });
    });

    const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 5]).nice().range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));

    const line = d3.line().x(d => x(d.date)).y(d => y(d.count)).curve(d3.curveStepAfter);
    
    const area = d3.area().x(d => x(d.date)).y0(height - margin.bottom).y1(d => y(d.count)).curve(d3.curveStepAfter);
    svg.append("path").datum(data).attr("fill", "rgba(51, 51, 51, 0.05)").attr("d", area);
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", "#555").attr("stroke-width", 2).attr("d", line);

    const deacts = data.filter(d => d.severity === "DEACTIVATION");
    svg.selectAll(".dot-deact")
        .data(deacts).enter().append("circle").attr("class", "dot-deact")
        .attr("cx", d => x(d.date)).attr("cy", d => y(d.count))
        .attr("r", 5)
        .attr("fill", d => d.event === 'OPEN' ? "#dc3545" : "#28a745") 
        .on("mouseover", (e, d) => {
            const txt = d.event === 'OPEN' ? "DEACTIVATION" : "DEACTIVATION Resuelta!";
            tooltip.style("opacity", 1).html(txt);
        })
        .on("mousemove", e => tooltip.style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 28) + "px"))
        .on("mouseout", () => tooltip.style("opacity", 0));
}

function renderClientServicesBurnup() {
    const container = d3.select("#client-chart2-container");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = container.append("svg").attr("width", width).attr("height", height);
    let tooltip = d3.select("body").select(".d3-tooltip");

    const grouped = d3.rollup(clientAppointments, 
        v => ({
            scope: d3.sum(v, d => d.services.length),
            done: d3.sum(v, d => d.status === "DONE" ? d.services.length : 0),
            hasAnualDone: d3.max(v, d => (d.status === "DONE" && d.services.some(s=>s.frequency === "ANUAL")) ? 1 : 0) > 0
        }),
        d => {
            const date = new Date(d.date);
            date.setDate(1); 
            return date.toISOString().split('T')[0];
        }
    );

    let data = Array.from(grouped, ([date, vals]) => ({ date: new Date(date), ...vals }));
    data.sort((a,b) => a.date - b.date);

    let cumScope = 0, cumDone = 0;
    data.forEach(d => {
        cumScope += d.scope; cumDone += d.done;
        d.scope = cumScope; d.done = cumDone;
    });

    const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.scope) || 10]).nice().range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));

    const lineScope = d3.line().x(d => x(d.date)).y(d => y(d.scope)).curve(d3.curveMonotoneX);
    const lineDone = d3.line().x(d => x(d.date)).y(d => y(d.done)).curve(d3.curveMonotoneX);

    svg.append("path").datum(data).attr("fill", "rgba(255, 115, 34, 0.1)").attr("d", d3.area().x(d=>x(d.date)).y0(height-margin.bottom).y1(d=>y(d.done)).curve(d3.curveMonotoneX));
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", "#ccc").attr("stroke-width", 2).attr("stroke-dasharray", "4 4").attr("d", lineScope);
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", "#FF7322").attr("stroke-width", 3).attr("d", lineDone);

    const anuals = data.filter(d => d.hasAnualDone);
    svg.selectAll(".dot-great")
        .data(anuals).enter().append("circle").attr("class", "dot-great")
        .attr("cx", d => x(d.date)).attr("cy", d => y(d.done))
        .attr("r", 6)
        .attr("fill", "#28a745") 
        .attr("stroke", "#fff").attr("stroke-width", 2)
        .on("mouseover", (e, d) => {
            tooltip.style("opacity", 1).html(`<strong>GREAT!</strong><br>Servicio Anual Completado<br>Acumulado: ${d.done}`);
        })
        .on("mousemove", e => tooltip.style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 28) + "px"))
        .on("mouseout", () => tooltip.style("opacity", 0));
}

window.addEventListener('DOMContentLoaded', () => {
    generateClientData();
    renderClientKPIsAndLists();
    
    document.getElementById('btn-client').addEventListener('click', () => {
        setTimeout(() => {
            renderClientBurndown();
            renderClientServicesBurnup();
        }, 50);
    });
});