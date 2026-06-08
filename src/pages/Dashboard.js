import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore"; 
import { db, auth } from "../firebase/firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import dayjs from "dayjs";
import { FaChartBar, FaChartLine, FaChartPie, FaFilePdf, FaSpinner, FaBan } from "react-icons/fa";
import { gerarRelatorioPremium } from "../utils/geradorPDF";
import './Dashboard.css'; 

export default function Dashboard({ fechar }) {
  const usuario = auth.currentUser;
  
  const [isDono, setIsDono] = useState(null); 
  const [pedidos, setPedidos] = useState([]);
  const [faturamento, setFaturamento] = useState(0);
  const [quantidade, setQuantidade] = useState(0);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [dadosPagamento, setDadosPagamento] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  const lineChartRef = useRef();
  const pieChartRef = useRef();

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuario) return setIsDono(false);
      
      try {
        const userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
        
        if (userDoc.exists() && userDoc.data().tipo === "admin") {
          setIsDono(true);
          
          // Removida a trava de 30 dias para permitir o relatório anual completo
          const q = query(
            collection(db, "pedidos"),
            orderBy("data", "desc")
          );
          
          const snapshotP = await getDocs(q);
          setPedidos(snapshotP.docs.map((doc) => doc.data()));
        } else {
          setIsDono(false);
        }
      } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);
        setIsDono(false);
      }
    };
    
    carregarDados();
  }, [usuario]);

  useEffect(() => {
    const aplicarFiltro = () => {
      const agora = dayjs();
      let filtrados = pedidos.filter((p) => p.status === "Entregue");

      if (filtro === "hoje") {
        filtrados = filtrados.filter((p) => dayjs(p.data).isSame(agora, "day"));
      } else if (filtro === "7dias") {
        filtrados = filtrados.filter((p) => dayjs(p.data).isAfter(agora.subtract(7, "day")));
      } else if (filtro === "mes") {
        filtrados = filtrados.filter((p) => dayjs(p.data).isSame(agora, "month"));
      } else if (filtro === "ano") {
        // Lógica do Filtro Anual adicionada
        filtrados = filtrados.filter((p) => dayjs(p.data).isSame(agora, "year"));
      }

      setFaturamento(filtrados.reduce((acc, p) => acc + (p.total || 0), 0));
      setQuantidade(filtrados.length);

      const agrupamento = {};
      filtrados.forEach((p) => {
        const dia = dayjs(p.data).format("DD/MM/YYYY");
        if (!agrupamento[dia]) agrupamento[dia] = { dia, faturamento: 0, pedidos: 0 };
        agrupamento[dia].faturamento += p.total || 0;
        agrupamento[dia].pedidos += 1;
      });

      const dadosOrdenados = Object.values(agrupamento).sort((a, b) => {
        const [diaA, mesA, anoA] = a.dia.split("/").map(Number);
        const [diaB, mesB, anoB] = b.dia.split("/").map(Number);
        return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
      });

      // Correção visual para o gráfico não bugar quando há apenas 1 dia de venda
      if (dadosOrdenados.length === 1) {
          dadosOrdenados.unshift({ dia: '', faturamento: 0, pedidos: 0 });
          dadosOrdenados.push({ dia: ' ', faturamento: 0, pedidos: 0 });
      }

      setDadosGrafico(dadosOrdenados);

      const pgto = {};
      filtrados.forEach((p) => {
        const f = p.formaPagamento || "Outros";
        pgto[f] = (pgto[f] || 0) + (p.total || 0);
      });
      setDadosPagamento(Object.entries(pgto).map(([name, value]) => ({ name, value })));
    };

    if (pedidos.length > 0) aplicarFiltro();
  }, [pedidos, filtro]);

  const handleGerarPDF = () => {
    gerarRelatorioPremium(pedidos, faturamento, quantidade, filtro, lineChartRef.current, pieChartRef.current);
  };

  const COLORS = ["#00ff66", "#8884d8", "#ffbb28", "#ff8042"];

  if (isDono === null) return <div className="cartao"><h2 className="dash-title"><FaSpinner className="fa-spin" /> Carregando Painel...</h2></div>;
  if (isDono === false) return <div className="cartao"><h2 className="dash-title" style={{ color: '#ff4444' }}><FaBan /> Acesso Negado</h2><button onClick={fechar} className="botao botao-vermelho">Sair</button></div>;

  return (
    <div className="cartao">
      <h2 className="dash-title"><FaChartBar /> Dashboard Empresarial</h2>

      <div className="dash-filtros">
        <label><b>Filtrar Período:</b> </label>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="dash-select">
          <option value="todos">Todos os Tempos</option>
          <option value="hoje">Hoje</option>
          <option value="7dias">Últimos 7 Dias</option>
          <option value="mes">Mês Atual</option>
          <option value="ano">Ano Atual</option>
        </select>
      </div>

      <div className="dash-stats">
        <p><b>Pedidos Entregues:</b> {quantidade}</p>
        <p><b>Faturamento:</b> R$ {faturamento.toFixed(2)}</p>
      </div>

      <h3 className="dash-h3"><FaChartLine /> Histórico de Vendas</h3>
      <div ref={lineChartRef} className="dash-grafico">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="dia" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: "#333", border: "none", color: "#fff" }} />
            <Legend />
            <Line type="monotone" dataKey="faturamento" stroke="#00ff66" strokeWidth={3} name="R$" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="pedidos" stroke="#8884d8" strokeWidth={3} name="Qtd" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="dash-h3"><FaChartPie /> Meios de Pagamento</h3>
      <div ref={pieChartRef} className="dash-grafico">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={dadosPagamento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {dadosPagamento.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <button onClick={handleGerarPDF} className="botao btn-pdf-full">
        <FaFilePdf /> Gerar Relatório Profissional
      </button>
    </div>
  );
}