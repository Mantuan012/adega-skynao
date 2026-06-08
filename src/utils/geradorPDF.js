import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

export const gerarRelatorioPremium = async (pedidos, faturamento, quantidade, filtro) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let pageNumber = 1;

  // --- FILTRAGEM DE DADOS (Base de inteligência) ---
  const agora = dayjs();
  let pedidosFiltrados = pedidos.filter((p) => p.status === "Entregue");
  if (filtro === "hoje") pedidosFiltrados = pedidosFiltrados.filter((p) => dayjs(p.data).isSame(agora, "day"));
  else if (filtro === "7dias") pedidosFiltrados = pedidosFiltrados.filter((p) => dayjs(p.data).isAfter(agora.subtract(7, "day")));
  else if (filtro === "mes") pedidosFiltrados = pedidosFiltrados.filter((p) => dayjs(p.data).isSame(agora, "month"));

  // Lógica de insights
  let itensTotais = 0;
  const agrupamentoPgto = {};
  pedidosFiltrados.forEach((p) => {
    p.itens?.forEach(item => { itensTotais += item.quantidade; });
    const f = p.formaPagamento || "Outros";
    agrupamentoPgto[f] = (agrupamentoPgto[f] || 0) + 1;
  });

  // --- FUNÇÕES DE DESENHO (Layout Profissional) ---
  const drawHeader = () => {
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(0, 255, 102);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ADEGA SKYNÃO - RELATÓRIO DE VENDAS", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Período: ${filtro.toUpperCase()} | Emitido em: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 21);
  };

  const drawFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  };

  // --- CAPA E RESUMO ---
  drawHeader();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("1. RESUMO EXECUTIVO", 14, 40);
  
  const ticketMedio = quantidade > 0 ? (faturamento / quantidade) : 0;
  
  doc.autoTable({
    startY: 45,
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Pedidos', `${quantidade} pedidos`],
      ['Faturamento Bruto', `R$ ${faturamento.toFixed(2)}`],
      ['Ticket Médio', `R$ ${ticketMedio.toFixed(2)}`],
      ['Produtos Vendidos', `${itensTotais} unidades`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 60] }
  });

  // --- TABELA DETALHADA (Aqui está o segredo para ser leve e mobile) ---
  doc.addPage();
  pageNumber++;
  drawHeader();
  doc.setFontSize(14);
  doc.text("2. DETALHAMENTO DE PEDIDOS", 14, 40);

  const tabelaDados = pedidosFiltrados.map(p => [
    `#${p.idPedido || '---'}`,
    p.enderecoEntrega?.nome || 'Cliente',
    dayjs(p.data).format("DD/MM HH:mm"),
    p.formaPagamento || 'N/A',
    `R$ ${p.total?.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 45,
    head: [['ID', 'Cliente', 'Data', 'Pagamento', 'Total']],
    body: tabelaDados,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 15, 15] }
  });

  drawFooter();
  doc.save(`Relatorio_Vendas_${dayjs().format("DD-MM-YYYY")}.pdf`);
};