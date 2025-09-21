// Q1: Mặt hàng bán chạy nhất/kém nhất
function q1() {
    clearAll();
    d3.select("#title").html("");
    d3.select("#title").append("h2")
        .attr("class", "chart-title")
        .style("margin-bottom", "2px")
        .style("text-align", "center")
        .style("width", "100%")
        .text("Doanh số bán hàng theo Mặt hàng");

    if (!globalData) {
        loadData().then(q1);
        return;
    }

    // Gom dữ liệu theo mặt hàng
    const itemData = Array.from(d3.rollup(globalData,
        v => ({
            revenue: d3.sum(v, d => d['Thành tiền']),
            name: v[0]['Tên mặt hàng'],
            groupId: v[0]['Mã nhóm hàng'],
            groupName: v[0]['Tên nhóm hàng'],
            quantity: d3.sum(v, d => d['SL'])
        }),
        d => d['Mã mặt hàng']
    )).map(d => ({
        id: d[0],
        ...d[1]
    }));

    // Sắp xếp theo doanh thu giảm dần
    itemData.sort((a, b) => b.revenue - a.revenue);

    // Tạo nhãn nhóm hàng
    const groups = Array.from(new Set(itemData.map(d => {
        let code = d.groupId?.trim() || '';
        let name = d.groupName?.trim() || '';
        return `[${code}] ${name}`;
    })));

    const color = d3.scaleOrdinal().domain(groups).range(d3.schemeCategory10);

    // Bổ sung nhãn
    itemData.forEach(d => {
        d.label = `[${d.id}] ${d.name}`;
        d.groupLabel = `[${d.groupId?.trim() || ''}] ${d.groupName?.trim() || ''}`;
    });

    // Cấu hình kích thước
    const margin = { top: 40, right: 240, bottom: 40, left: 300 };
    const width = 1000, height = 600;

    const svg = makeSvg(width, height).attr("class","q1");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Scale Y theo tên mặt hàng
    const y = d3.scaleBand()
        .domain(itemData.map(d => d.label))
        .range([0, height])
        .padding(0.15);

    // Scale X theo doanh thu
    const maxRevenue = d3.max(itemData, d => d.revenue) || 1;
    const x = d3.scaleLinear()
        .domain([0, Math.ceil(maxRevenue/1e8)*1e8]) // làm tròn theo 100tr
        .nice()
        .range([0, width]);

    // Trục X + grid
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => (d/1e6) + "M"))
        .call(g => g.selectAll("path,line").attr("stroke", "#e0e0e0"));

    g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("font-size", "13px");

    g.append("g")
        .call(d3.axisBottom(x).tickSize(height).tickFormat(""))
        .call(g => g.selectAll("line").attr("stroke", "#e5e5e5"))
        .call(g => g.select(".domain").remove());

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(255,255,255,0.95)")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("display", "none")
        .style("pointer-events", "none")
        .style("font-size", "13px");

    // Cột
    g.selectAll("rect").data(itemData).join("rect")
        .attr("y", d => y(d.label))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", d => x(d.revenue))
        .attr("rx", 4).attr("ry", 4)
        .attr("fill", d => color(d.groupLabel))
        .on("mousemove", (ev,d) => {
            tooltip.style("display", "block")
                .html(`
                    <b>Mặt hàng:</b> [${d.id}] ${d.name}<br>
                    <b>Nhóm hàng:</b> ${d.groupLabel}<br>
                    <b>Doanh số:</b> ${d3.format(",")(Math.round(d.revenue))} VND<br>
                    <b>Số lượng:</b> ${d3.format(",")(d.quantity)} SP
                `)
                .style("left", (ev.pageX+8)+"px")
                .style("top", (ev.pageY-28)+"px");
        })
        .on("mouseleave", () => tooltip.style("display","none"));

    // Nhãn số trên cột
    g.selectAll(".lbl").data(itemData).join("text")
        .attr("class","lbl")
        .attr("x", d => x(d.revenue)+6)
        .attr("y", d => y(d.label) + y.bandwidth()/2 + 5)
        .text(d => (d.revenue/1e6).toFixed(1)+"M VND")
        .style("font-size","12px")
        .style("fill","#222");

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 40}, ${margin.top})`);
    groups.forEach((gr,i) => {
        legend.append("rect")
            .attr("x",0).attr("y",i*24)
            .attr("width",18).attr("height",18)
            .attr("fill", color(gr));
        legend.append("text")
            .attr("x",24).attr("y",i*24+13)
            .text(gr).style("font-size","12px");
    });
}
