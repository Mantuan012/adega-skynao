import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

export const gerarRelatorioPremium = async (pedidos, faturamento, quantidade, filtro) => {
  const doc = new jsPDF("p", "mm", "a4");
  const verdeAdega = [0, 255, 102];
  const cinzaEscuro = [30, 30, 30];
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- FUNÇÕES DE LAYOUT ---
  const drawHeader = () => {
    doc.setFillColor(...cinzaEscuro);
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(...verdeAdega);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ADEGA SKYNÃO - RELATÓRIO PROFISSIONAL", 14, 15);
  };

  const pedidosFiltrados = pedidos.filter(p => p.status === "Entregue");
  
  // --- 1. RESUMO EXECUTIVO (Tabela Detalhada) ---
  drawHeader();
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text("1. RESUMO E INDICADORES", 14, 40);

  autoTable(doc, {
    startY: 45,
    head: [['Indicador', 'Valor / Detalhe']],
    body: [
      ['Faturamento Total', `R$ ${faturamento.toFixed(2)}`],
      ['Total de Pedidos', `${quantidade} pedidos`],
      ['Ticket Médio', `R$ ${(quantidade > 0 ? faturamento/quantidade : 0).toFixed(2)}`],
      ['Período Analisado', filtro.toUpperCase()]
    ],
    theme: 'grid',
    headStyles: { fillColor: cinzaEscuro, textColor: verdeAdega }
  });

  // --- 2. GRÁFICO ANALÍTICO COM VALORES (Barras com Legenda) ---
  const pagamentos = pedidosFiltrados.reduce((acc, p) => {
    acc[p.formaPagamento] = (acc[p.formaPagamento] || 0) + 1;
    return acc;
  }, {});

  doc.text("2. DISTRIBUIÇÃO DE PAGAMENTOS (QUANTIDADE)", 14, 100);
  
  let yPos = 110;
  Object.entries(pagamentos).forEach(([metodo, qtd]) => {
    // Adiciona o valor explicitamente ao lado da barra
    doc.setFontSize(10);
    doc.text(`${metodo}: ${qtd} pedidos`, 14, yPos);
    doc.setFillColor(...verdeAdega);
    doc.rect(14, yPos + 2, (qtd / quantidade) * 100, 6, "F");
    yPos += 15;
  });

  // --- 3. DETALHAMENTO DE PEDIDOS (Com Datas e Totais) ---
  doc.addPage();
  drawHeader();
  doc.text("3. DETALHAMENTO ANALÍTICO DE PEDIDOS", 14, 40);

  autoTable(doc, {
    startY: 45,
    head: [['ID', 'Cliente', 'Data', 'Pagamento', 'Valor']],
    body: pedidosFiltrados.map(p => [
      `#${p.idPedido}`,
      p.enderecoEntrega?.nome || 'Cliente',
      dayjs(p.data).format("DD/MM/YYYY HH:mm"),
      p.formaPagamento,
      `R$ ${p.total.toFixed(2)}`
    ]),
    headStyles: { fillColor: cinzaEscuro, textColor: verdeAdega },
    columnStyles: { 4: { halign: 'right' } }
  });

  doc.save(`Relatorio_Skynao_${dayjs().format("DDMMYY")}.pdf`);
};