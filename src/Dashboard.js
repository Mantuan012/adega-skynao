import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";

export default function Dashboard({ fechar }) {
  const usuario = auth.currentUser;
  const isDono = usuario?.email === "pesquisaciencia012@gmail.com";

  const [pedidos, setPedidos] = useState([]);
  const [faturamento, setFaturamento] = useState(0);
  const [quantidade, setQuantidade] = useState(0);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [dadosPagamento, setDadosPagamento] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  const dashboardRef = useRef();

  useEffect(() => {
    const carregarDados = async () => {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const lista = snapshot.docs.map((doc) => doc.data());

      setPedidos(lista);
    };

    if (isDono) carregarDados();
  }, [isDono]);

  useEffect(() => {
    const aplicarFiltro = () => {
      const agora = dayjs();
      let filtrados = pedidos.filter((p) => p.status === "Entregue");

      if (filtro === "hoje") {
        filtrados = filtrados.filter((p) =>
          dayjs(p.data).isSame(agora, "day")
        );
      } else if (filtro === "7dias") {
        filtrados = filtrados.filter((p) =>
          dayjs(p.data).isAfter(agora.subtract(7, "day"))
        );
      } else if (filtro === "mes") {
        filtrados = filtrados.filter((p) =>
          dayjs(p.data).isSame(agora, "month")
        );
      }

      const totalFaturado = filtrados.reduce(
        (acc, p) => acc + (p.total || 0),
        0
      );
      const totalPedidos = filtrados.length;

      setFaturamento(totalFaturado);
      setQuantidade(totalPedidos);

      // 🔥 Dados para gráfico de linha
      const agrupamento = {};
      filtrados.forEach((pedido) => {
        const data = new Date(pedido.data);
        const dia = data.toLocaleDateString("pt-BR");

        if (!agrupamento[dia]) {
          agrupamento[dia] = {
            dia: dia,
            faturamento: 0,
            pedidos: 0,
          };
        }

        agrupamento[dia].faturamento += pedido.total || 0;
        agrupamento[dia].pedidos += 1;
      });

      const dadosArray = Object.values(agrupamento).sort((a, b) => {
        const [diaA, mesA, anoA] = a.dia.split("/").map(Number);
        const [diaB, mesB, anoB] = b.dia.split("/").map(Number);
        return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
      });

      setDadosGrafico(dadosArray);

      // 🔥 Dados para gráfico de pizza
      const pagamento = {};
      filtrados.forEach((p) => {
        const forma = p.formaPagamento || "Não informado";
        if (!pagamento[forma]) pagamento[forma] = 0;
        pagamento[forma] += p.total || 0;
      });

      const pagamentoArray = Object.entries(pagamento).map(
        ([forma, valor]) => ({
          name: forma,
          value: valor,
        })
      );

      setDadosPagamento(pagamentoArray);
    };

    aplicarFiltro();
  }, [pedidos, filtro]);

  const COLORS = ["#00ff66", "#8884d8", "#ffbb28", "#ff8042"];

  const gerarPDF = () => {
    const input = dashboardRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio-Adega-${dayjs().format("DD-MM-YYYY")}.pdf`);
    });
  };

  if (!isDono) {
    return (
      <div className="cartao">
        <h2>🚫 Acesso Negado</h2>
        <p>Você não tem permissão para acessar este painel.</p>
        <button onClick={fechar} className="botao botao-vermelho">
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="cartao" ref={dashboardRef}>
      <h2 className="titulo-principal">📊 Dashboard Empresarial</h2>

      <div>
        <label>
          <b>Filtrar:</b>{" "}
        </label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #00ff66",
            backgroundColor: "#222",
            color: "#e0e0e0",
            marginLeft: "10px",
          }}
        >
          <option value="todos">Todo Período</option>
          <option value="hoje">Hoje</option>
          <option value="7dias">Últimos 7 Dias</option>
          <option value="mes">Mês Atual</option>
        </select>
      </div>

      <p>
        <b>Total de Pedidos Entregues:</b> {quantidade}
      </p>
      <p>
        <b>Faturamento Total:</b> R$ {faturamento.toFixed(2)}
      </p>

      <h3 style={{ marginTop: "20px", color: "#00ff66" }}>
        📈 Faturamento e Pedidos por Dia
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={dadosGrafico}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dia" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="faturamento"
            stroke="#00ff66"
            name="Faturamento (R$)"
          />
          <Line
            type="monotone"
            dataKey="pedidos"
            stroke="#8884d8"
            name="Pedidos"
          />
        </LineChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: "20px", color: "#00ff66" }}>
        🥧 Faturamento por Forma de Pagamento
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dadosPagamento}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {dadosPagamento.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ marginTop: "10px" }}>
        <button onClick={gerarPDF} className="botao">
          🧾 Gerar Relatório PDF
        </button>
        <button onClick={fechar} className="botao botao-vermelho">
          Fechar
        </button>
      </div>
    </div>
  );
}