import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";

export const gerarRelatorioPremium = async (pedidos, faturamento, quantidade, filtro, lineChartElement, pieChartElement) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yOffset = 0;
  let pageNumber = 1;

  // --- 0. FILTRO DE DATAS (Para o PDF espelhar exatamente a tela) ---
  const agora = dayjs();
  let pedidosFiltrados = pedidos.filter((p) => p.status === "Entregue");
  if (filtro === "hoje") pedidosFiltrados = pedidosFiltrados.filter((p) => dayjs(p.data).isSame(agora, "day"));
  else if (filtro === "7dias") pedidosFiltrados = pedidosFiltrados.filter((p) => dayjs(p.data).isAfter(agora.subtract(7, "day")));
  else if (filtro === "mes") pedidosFiltrados = pedidosFiltrados.filter((p) => dayjs(p.data).isSame(agora, "month"));

  // --- LÓGICA DE INSIGHTS INTELIGENTES ---
  const agrupamentoDias = {};
  const agrupamentoPgto = {};
  let itensTotais = 0;

  pedidosFiltrados.forEach((p) => {
    // Para total de itens
    p.itens?.forEach(item => { itensTotais += item.quantidade; });
    
    // Para o gráfico de Linha (Melhor Dia)
    const dia = dayjs(p.data).format("DD/MM/YYYY");
    agrupamentoDias[dia] = (agrupamentoDias[dia] || 0) + (p.total || 0);

    // Para o gráfico de Pizza (Pagamento Favorito)
    const f = p.formaPagamento || "Outros";
    agrupamentoPgto[f] = (agrupamentoPgto[f] || 0) + 1;
  });

  const melhorDia = Object.entries(agrupamentoDias).sort((a, b) => b[1] - a[1])[0];
  const textoMelhorDia = melhorDia 
    ? `Insight: O pico de vendas no período foi em ${melhorDia[0]}, faturando R$ ${melhorDia[1].toFixed(2)} num único dia.` 
    : "Insight: O gráfico ilustra a progressão do volume de vendas diárias.";

  const melhorPgto = Object.entries(agrupamentoPgto).sort((a, b) => b[1] - a[1])[0];
  const percentual = melhorPgto && quantidade > 0 ? ((melhorPgto[1] / quantidade) * 100).toFixed(1) : 0;
  const textoPgto = melhorPgto
    ? `Insight: O método "${melhorPgto[0]}" é a preferência dos clientes, representando ${percentual}% das entregas.`
    : "Insight: O gráfico demonstra a distribuição das preferências de pagamento.";


  // --- FUNÇÕES DE DESENHO DO PDF ---
  const drawHeaderFooter = () => {
    pdf.setFillColor(15, 15, 15);
    pdf.rect(0, 0, pageWidth, 30, "F");
    pdf.setTextColor(0, 255, 102); 
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("ADEGA SKYNÃO", 15, 15);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("RELATÓRIO DE INTELIGÊNCIA DE VENDAS", 15, 22);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(9);
    pdf.text(`Emitido: ${dayjs().format("DD/MM/YYYY HH:mm")}`, pageWidth - 15, 18, { align: "right" });
    pdf.text(`Filtro: ${filtro === "todos" ? "Todo o Período" : filtro}`, pageWidth - 15, 23, { align: "right" });
    
    pdf.setFillColor(15, 15, 15);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text("Software Factory 2026 - Adega Skynão", 15, pageHeight - 6);
    pdf.text(`Página ${pageNumber}`, pageWidth - 15, pageHeight - 6, { align: "right" });
  };

  drawHeaderFooter();
  yOffset = 40;

  // --- 1. RESUMO EXECUTIVO ---
  const ticketMedio = quantidade > 0 ? (faturamento / quantidade) : 0;

  pdf.setTextColor(0, 100, 40); 
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("1. RESUMO EXECUTIVO", 15, yOffset);
  yOffset += 2;
  pdf.setDrawColor(0, 255, 102);
  pdf.setLineWidth(0.5);
  pdf.line(15, yOffset, pageWidth - 15, yOffset); 
  yOffset += 10;

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yOffset, 85, 25, "F");
  pdf.rect(110, yOffset, 85, 25, "F");
  pdf.setTextColor(100, 100, 100);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Total de Pedidos Concluídos", 20, yOffset + 8);
  pdf.text("Faturamento Bruto", 115, yOffset + 8);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(`${quantidade} pedidos`, 20, yOffset + 18);
  pdf.text(`R$ ${faturamento.toFixed(2)}`, 115, yOffset + 18);
  yOffset += 30;

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yOffset, 85, 25, "F");
  pdf.rect(110, yOffset, 85, 25, "F");
  pdf.setTextColor(100, 100, 100);
  pdf.setFont("helvetica", "normal");
  pdf.text("Ticket Médio", 20, yOffset + 8);
  pdf.text("Total de Produtos Vendidos", 115, yOffset + 8);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.text(`R$ ${ticketMedio.toFixed(2)}`, 20, yOffset + 18);
  pdf.text(`${itensTotais} unidades`, 115, yOffset + 18);
  yOffset += 40;

  // --- 2. GRÁFICOS ANALÍTICOS COM INSIGHTS ---
  pdf.setTextColor(0, 100, 40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("2. ANÁLISE VISUAL DE TENDÊNCIAS", 15, yOffset);
  yOffset += 2;
  pdf.line(15, yOffset, pageWidth - 15, yOffset);
  yOffset += 10;

  try {
    if (lineChartElement) {
      const canvasLine = await html2canvas(lineChartElement, { scale: 2, backgroundColor: "#1e1e1e" });
      const imgWidth = 180;
      const imgHeight = (canvasLine.height * imgWidth) / canvasLine.width; 
      pdf.addImage(canvasLine.toDataURL("image/png"), "PNG", 15, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 5;

      // Caixa de Insight do Gráfico de Linha
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yOffset, pageWidth - 30, 10, "F");
      pdf.setDrawColor(0, 255, 102);
      pdf.setLineWidth(1);
      pdf.line(15, yOffset, 15, yOffset + 10); 
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(textoMelhorDia, 18, yOffset + 6.5);
      yOffset += 20;
    }

    if (yOffset > 170) { 
      pageNumber++; pdf.addPage(); drawHeaderFooter(); yOffset = 40;
    }

    if (pieChartElement) {
      const canvasPie = await html2canvas(pieChartElement, { scale: 2, backgroundColor: "#1e1e1e" });
      const imgWidth = 170; 
      const imgHeight = (canvasPie.height * imgWidth) / canvasPie.width; 
      const xOffset = (pageWidth - imgWidth) / 2; 
      pdf.addImage(canvasPie.toDataURL("image/png"), "PNG", xOffset, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 5;

      // Caixa de Insight do Gráfico de Pizza
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yOffset, pageWidth - 30, 10, "F");
      pdf.setDrawColor(0, 255, 102);
      pdf.setLineWidth(1);
      pdf.line(15, yOffset, 15, yOffset + 10); 
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(textoPgto, 18, yOffset + 6.5);
    }
  } catch (error) { console.error("Erro nos gráficos:", error); }

  // --- 3. DETALHAMENTO DE PEDIDOS RECENTES ---
  pageNumber++;
  pdf.addPage();
  drawHeaderFooter();
  yOffset = 40;

  pdf.setTextColor(0, 100, 40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("3. DETALHAMENTO DE PEDIDOS RECENTES", 15, yOffset);
  yOffset += 2;
  pdf.line(15, yOffset, pageWidth - 15, yOffset);
  yOffset += 10;

  pdf.setFillColor(0, 255, 102); 
  pdf.rect(15, yOffset, pageWidth - 30, 10, "F");
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.text("ID", 20, yOffset + 6.5);
  pdf.text("Cliente", 45, yOffset + 6.5);
  pdf.text("Data", 110, yOffset + 6.5);
  pdf.text("Forma Pgto", 145, yOffset + 6.5);
  pdf.text("Total", 180, yOffset + 6.5);
  yOffset += 10;

  pdf.setFont("helvetica", "normal");
  const ultimosPedidos = pedidosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 20); 

  if (ultimosPedidos.length === 0) {
    pdf.setTextColor(100, 100, 100);
    pdf.text("Nenhum pedido entregue no período.", 20, yOffset + 10);
  } else {
    ultimosPedidos.forEach((p, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(15, yOffset, pageWidth - 30, 10, "F");
      }
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(9);
      pdf.text(`#${p.idPedido || '---'}`, 20, yOffset + 6.5);
      pdf.text(`${p.enderecoEntrega?.nome?.substring(0, 25) || 'N/A'}`, 45, yOffset + 6.5);
      pdf.text(`${dayjs(p.data).format("DD/MM HH:mm")}`, 110, yOffset + 6.5);
      pdf.text(`${p.formaPagamento || 'N/A'}`, 145, yOffset + 6.5);
      pdf.text(`R$ ${p.total?.toFixed(2)}`, 180, yOffset + 6.5);
      yOffset += 10;
    });
  }

  pdf.save(`Relatorio-Inteligencia-AdegaSkynao-${dayjs().format("DD-MM-YYYY")}.pdf`);
};