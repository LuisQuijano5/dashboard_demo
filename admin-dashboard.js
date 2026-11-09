// Nov 9, 2026
const TODAY = new Date("2026-11-09T00:00:00Z");

const clientsList = [
    { id: "1", name: "ADN" },
    { id: "2", name: "PR ASK CHEMICALS" },
    { id: "3", name: "EMPRESA DE PRUEBA OCT 30" },
    { id: "4", name: "76" }
];

let appointments = [];
let findings = [];

function generateMockData() {
    const statuses = ["PENDING", "CONFIRMED", "DONE"];
    const findStatuses = ["OPENED", "CLOSED"];
    
    for (let i = 0; i < 500; i++) {
        const rDate = new Date(TODAY.getTime() + (Math.random() * 365 - 182) * 24 * 60 * 60 * 1000);
        const cId = clientsList[Math.floor(Math.random() * clientsList.length)].id;
        const stat = statuses[Math.floor(Math.random() * statuses.length)];
        
        let srvs = [];
        const numSrvs = Math.floor(Math.random() * 3) + 1;
        for(let s=0; s<numSrvs; s++) {
            srvs.push({
                serviceOrderId: `SO_${i}_${s}`,
                type: "maintenance",
                frequency: Math.random() < 0.05 ? "ANUAL" : "monthly",
                assetId: "A1"
            });
        }

        appointments.push({
            appointmentId: `APT_${i}`,
            clientId: cId,
            scheduledStart: rDate.toISOString(),
            status: stat,
            serviceOrders: srvs
        });

        if(i % 3 === 0) { 
            const fStat = findStatuses[Math.floor(Math.random() * findStatuses.length)];
            const fDate = new Date(rDate.getTime() - (Math.random() * 10) * 24*60*60*1000); 
            findings.push({
                status: fStat,
                clientId: cId,
                severity: Math.random() < 0.03 ? "DEACTIVATION" : "CRITICAL",
                reportDate: fDate.toISOString(),
                closedDate: fStat === "CLOSED" ? rDate.toISOString() : null
            });
        }
    }
}
generateMockData();

function calculateGeneralKPIs() {
    document.getElementById('kpi-clients').innerText = clientsList.length;

    const todayStr = TODAY.toISOString().split('T')[0];
    let apptTodayTotal = 0, apptTodayDone = 0;
    let srvTodayTotal = 0, srvTodayDone = 0;
    let totalDoneAppts = 0, totalDoneSrvs = 0;

    appointments.forEach(a => {
        const dStr = a.scheduledStart.split('T')[0];
        if (dStr === todayStr) {
            apptTodayTotal++;
            srvTodayTotal += a.serviceOrders.length;
            if (a.status === "DONE") {
                apptTodayDone++;
                srvTodayDone += a.serviceOrders.length;
            }
        }
        
        if (a.status === "DONE") {
            totalDoneAppts++;
            totalDoneSrvs += a.serviceOrders.length;
        }
    });

    document.getElementById('kpi-appt-total').innerText = apptTodayTotal;
    document.getElementById('kpi-appt-done').innerText = apptTodayDone;
    document.getElementById('kpi-srv-total').innerText = srvTodayTotal;
    document.getElementById('kpi-srv-done').innerText = srvTodayDone;
    document.getElementById('kpi-avg-appt').innerText = (totalDoneAppts / 365).toFixed(1);
    document.getElementById('kpi-avg-srv').innerText = (totalDoneSrvs / 365).toFixed(1);
}

let currentClientFilter = "ALL";

function initFilters() {
    const sel = document.getElementById('client-filter');
    clientsList.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = c.name;
        sel.appendChild(opt);
    });

    sel.addEventListener('change', (e) => {
        currentClientFilter = e.target.value;
        updateFilteredView();
    });

    const defaultStart = new Date(TODAY); defaultStart.setMonth(defaultStart.getMonth() - 6);
    const defaultEnd = new Date(TODAY); defaultEnd.setMonth(defaultEnd.getMonth() + 6);
    
    const chart1End = new Date(TODAY); chart1End.setMonth(chart1End.getMonth() + 1);
    document.getElementById('date-start-chart1').valueAsDate = TODAY;
    document.getElementById('date-end-chart1').valueAsDate = chart1End;

    [2,3,4].forEach(i => {
        document.getElementById(`date-start-chart${i}`).valueAsDate = defaultStart;
        document.getElementById(`date-end-chart${i}`).valueAsDate = defaultEnd;
    });

    [1,2,3,4].forEach(i => {
        document.getElementById(`date-start-chart${i}`).addEventListener('change', updateFilteredView);
        document.getElementById(`date-end-chart${i}`).addEventListener('change', updateFilteredView);
        
        const btn = document.getElementById(`toggle-chart${i}`);
        btn.addEventListener('click', function() {
            const currentType = this.getAttribute('data-type');
            const newType = currentType === 'line' ? 'pie' : 'line';
            this.setAttribute('data-type', newType);
            this.innerHTML = newType === 'line' ? '<i class="fas fa-chart-pie"></i>' : '<i class="fas fa-chart-line"></i>';
            updateFilteredView();
        });
    });
}

function renderChart(containerId, data, config) {
    const container = d3.select(`#${containerId}`);
    container.selectAll("*").remove(); 

    const legend = container.append("div")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("gap", "20px")
        .style("font-size", "12px")
        .style("margin-bottom", "10px")
        .style("color", "#555");

    if (config.type === 'line') {
        legend.html(`
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:12px; height:4px; background:#ccc; display:inline-block;"></span>
                ${config.scopeLabel}
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:12px; height:4px; background:#FF7322; display:inline-block;"></span>
                ${config.progressLabel}
            </div>
        `);
    } else {
        legend.html(`
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:12px; height:12px; background:#e0e0e0; border-radius:50%; display:inline-block;"></span>
                ${config.pieLabelRest}
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:12px; height:12px; background:#FF7322; border-radius:50%; display:inline-block;"></span>
                ${config.pieLabelDone}
            </div>
        `);
    }

    const width = container.node().getBoundingClientRect().width;
    const height = 260; 
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    let tooltip = d3.select("body").select(".d3-tooltip");
    if(tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");
    }

    if (config.type === 'line') {
        const grouped = d3.rollup(data, 
            v => ({ 
                val1: d3.sum(v, d => d.val1), 
                val2: d3.sum(v, d => d.val2),
                alertScope: d3.max(v, d => d.alertScope ? 1 : 0) > 0,
                alertProg: d3.max(v, d => d.alertProg ? 1 : 0) > 0
            }), 
            d => {
                const date = new Date(d.date);
                date.setDate(date.getDate() - date.getDay()); 
                return date.toISOString().split('T')[0];
            }
        );
        
        let lineData = Array.from(grouped, ([date, vals]) => ({ date: new Date(date), ...vals }));
        lineData.sort((a,b) => a.date - b.date);

        let cumScope = 0;
        let cumProgress = 0;
        lineData.forEach(d => {
            cumScope += d.val1;
            cumProgress += d.val2;
            d.val1 = cumScope; 
            d.val2 = cumProgress; 
        });

        const x = d3.scaleTime()
            .domain(d3.extent(lineData, d => d.date))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(lineData, d => Math.max(d.val1, d.val2)) || 10])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const areaProgress = d3.area()
            .x(d => x(d.date))
            .y0(height - margin.bottom)
            .y1(d => y(d.val2))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(lineData)
            .attr("fill", "rgba(255, 115, 34, 0.1)")
            .attr("d", areaProgress);

        const line1 = d3.line().x(d => x(d.date)).y(d => y(d.val1)).curve(d3.curveMonotoneX);
        const line2 = d3.line().x(d => x(d.date)).y(d => y(d.val2)).curve(d3.curveMonotoneX);

        svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
        svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));

        svg.append("path").datum(lineData).attr("fill", "none").attr("stroke", "#ccc").attr("stroke-width", 3).attr("stroke-dasharray", "4 4").attr("d", line1);
        svg.append("path").datum(lineData).attr("fill", "none").attr("stroke", "#FF7322").attr("stroke-width", 3).attr("d", line2);

        svg.selectAll(".dot-scope")
            .data(lineData).enter().append("circle").attr("class", "dot-scope")
            .attr("cx", d => x(d.date)).attr("cy", d => y(d.val1))
            .attr("r", d => d.alertScope ? 5 : 4) 
            .attr("fill", d => d.alertScope ? "red" : "#ccc")
            .on("mouseover", (e, d) => {
                const extraText = d.alertScope && config.alertText ? `<br><strong style='color:#ff6b6b;'>Contiene ${config.alertText}</strong>` : "";
                tooltip.style("opacity", 1).html(`${config.scopeLabel}: ${d.val1}${extraText}`);
            })
            .on("mousemove", e => tooltip.style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 28) + "px"))
            .on("mouseout", () => tooltip.style("opacity", 0));

        svg.selectAll(".dot-prog")
            .data(lineData).enter().append("circle").attr("class", "dot-prog")
            .attr("cx", d => x(d.date)).attr("cy", d => y(d.val2))
            .attr("r", d => d.alertProg ? 5 : 4) 
            .attr("fill", d => d.alertProg ? "red" : "#FF7322")
            .on("mouseover", (e, d) => {
                const extraText = d.alertProg && config.alertText ? `<br><strong style='color:#ff6b6b;'>Contiene ${config.alertText}</strong>` : "";
                tooltip.style("opacity", 1).html(`${config.progressLabel}: ${d.val2}${extraText}`);
            })
            .on("mousemove", e => tooltip.style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 28) + "px"))
            .on("mouseout", () => tooltip.style("opacity", 0));

    } else if (config.type === 'pie') {
        const total1 = d3.sum(data, d => d.val1);
        const total2 = d3.sum(data, d => d.val2);
        
        const radius = Math.min(width, height) / 2 - margin.top;
        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
        
        const pieData = [
            { label: config.pieLabelDone, value: total2 }, 
            { label: config.pieLabelRest, value: Math.max(0, total1 - total2) }
        ];

        const color = d3.scaleOrdinal().domain([config.pieLabelDone, config.pieLabelRest]).range(["#FF7322", "#e0e0e0"]);
        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);

        g.selectAll("path")
            .data(pie(pieData))
            .enter().append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.label))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .on("mouseover", function(event, d) {
                tooltip.style("opacity", 1).html(`${d.data.label}: ${d.data.value}`);
            })
            .on("mousemove", (event) => tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px"))
            .on("mouseout", () => tooltip.style("opacity", 0));
    }
}

function updateFilteredView() {
    const fAppts = currentClientFilter === "ALL" ? appointments : appointments.filter(a => a.clientId === currentClientFilter);
    const fFinds = currentClientFilter === "ALL" ? findings : findings.filter(f => f.clientId === currentClientFilter);

    document.getElementById('kpi-filtered-visits').innerText = fAppts.length;

    const getDates = (id) => ({
        start: new Date(document.getElementById(`date-start-${id}`).value),
        end: new Date(document.getElementById(`date-end-${id}`).value)
    });

    const c1D = getDates('chart1');
    const c1Type = document.getElementById('toggle-chart1').getAttribute('data-type');
    const dataC1 = fAppts.filter(a => new Date(a.scheduledStart) >= c1D.start && new Date(a.scheduledStart) <= c1D.end)
        .map(a => ({ date: a.scheduledStart, val1: 1, val2: (a.status === "CONFIRMED" || a.status === "DONE") ? 1 : 0 }));
    
    let sumTotal1 = d3.sum(dataC1, d=>d.val1), sumConf = d3.sum(dataC1, d=>d.val2);
    document.getElementById('pct-chart1').innerText = sumTotal1 ? Math.round((sumConf/sumTotal1)*100) + '%' : '0%';
    renderChart('chart1-container', dataC1, { 
        type: c1Type, scopeLabel: 'Total Citas', progressLabel: 'Confirmadas',
        pieLabelRest: 'Por Confirmar', pieLabelDone: 'Confirmadas'
    });

    const c2D = getDates('chart2');
    const c2Type = document.getElementById('toggle-chart2').getAttribute('data-type');
    const dataC2 = fAppts.filter(a => new Date(a.scheduledStart) >= c2D.start && new Date(a.scheduledStart) <= c2D.end)
        .map(a => ({ date: a.scheduledStart, val1: 1, val2: a.status === "DONE" ? 1 : 0 }));
    
    let sumTotal2 = d3.sum(dataC2, d=>d.val1), sumDone2 = d3.sum(dataC2, d=>d.val2);
    document.getElementById('pct-chart2').innerText = sumTotal2 ? Math.round((sumDone2/sumTotal2)*100) + '%' : '0%';
    renderChart('chart2-container', dataC2, { 
        type: c2Type, scopeLabel: 'Total Programadas', progressLabel: 'Realizadas',
        pieLabelRest: 'Pendientes', pieLabelDone: 'Realizadas'
    });

    const c3D = getDates('chart3');
    const c3Type = document.getElementById('toggle-chart3').getAttribute('data-type');
    const dataC3 = fAppts.filter(a => new Date(a.scheduledStart) >= c3D.start && new Date(a.scheduledStart) <= c3D.end)
        .map(a => {
            const hasAnual = a.serviceOrders.some(so => so.frequency === 'ANUAL');
            const isDone = a.status === "DONE";
            return { 
                date: a.scheduledStart, 
                val1: a.serviceOrders.length, 
                val2: isDone ? a.serviceOrders.length : 0,
                alertScope: hasAnual,               
                alertProg: isDone && hasAnual       
            }
        });
    
    let sumTotal3 = d3.sum(dataC3, d=>d.val1), sumDone3 = d3.sum(dataC3, d=>d.val2);
    document.getElementById('pct-chart3').innerText = sumTotal3 ? Math.round((sumDone3/sumTotal3)*100) + '%' : '0%';
    renderChart('chart3-container', dataC3, { 
        type: c3Type, scopeLabel: 'Total Servicios', progressLabel: 'Servicios Realizados',
        pieLabelRest: 'Pendientes', pieLabelDone: 'Realizados',
        alertText: 'Servicio ANUAL' 
    });

    const c4D = getDates('chart4');
    const c4Type = document.getElementById('toggle-chart4').getAttribute('data-type');
    const dataC4 = fFinds.filter(f => new Date(f.reportDate) >= c4D.start && new Date(f.reportDate) <= c4D.end)
        .map(f => {
            const isDeact = f.severity === 'DEACTIVATION';
            const isClosed = f.status === "CLOSED";
            return { 
                date: f.reportDate, 
                val1: 1, 
                val2: isClosed ? 1 : 0,
                alertScope: isDeact,             
                alertProg: isClosed && isDeact   
            }
        });
    
    let sumTotal4 = d3.sum(dataC4, d=>d.val1), sumClosed = d3.sum(dataC4, d=>d.val2);
    document.getElementById('pct-chart4').innerText = sumTotal4 ? Math.round((sumClosed/sumTotal4)*100) + '%' : '0%';
    renderChart('chart4-container', dataC4, { 
        type: c4Type, scopeLabel: 'Total Hallazgos', progressLabel: 'Hallazgos Cerrados',
        pieLabelRest: 'Abiertos', pieLabelDone: 'Cerrados',
        alertText: 'Severidad DEACTIVATION' 
    });
}

window.onload = () => {
    calculateGeneralKPIs();
    initFilters();
    updateFilteredView();
};