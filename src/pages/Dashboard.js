import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import dayjs from "dayjs";
import { FaChartBar, FaChartLine, FaChartPie, FaFilePdf, FaSpinner, FaBan } from "react-icons/fa";

// Importações dos novos módulos limpos
import GerenciamentoUsuarios from "../components/GerenciamentoUsuarios";
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

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const lineChartRef = useRef();
  const pieChartRef = useRef();

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuario) return setIsDono(false);
      
      const userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
      if (userDoc.exists() && userDoc.data().tipo === "admin") {
        setIsDono(true);
        const snapshotP = await getDocs(collection(db, "pedidos"));
        setPedidos(snapshotP.docs.map((doc) => doc.data()));
        const snapshotU = await getDocs(collection(db, "usuarios"));
        setUsuarios(snapshotU.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingUsuarios(false);
      } else {
        setIsDono(false);
      }
    };
    carregarDados();
  }, [usuario]);

  useEffect(() => {
    const aplicarFiltro = () => {
      const agora = dayjs();
      let filtrados = pedidos.filter((p) => p.status === "Entregue");

      if (filtro === "hoje") filtrados = filtrados.filter((p) => dayjs(p.data).isSame(agora, "day"));
      else if (filtro === "7dias") filtrados = filtrados.filter((p) => dayjs(p.data).isAfter(agora.subtract(7, "day")));
      else if (filtro === "mes") filtrados = filtrados.filter((p) => dayjs(p.data).isSame(agora, "month"));

      setFaturamento(filtrados.reduce((acc, p) => acc + (p.total || 0), 0));
      setQuantidade(filtrados.length);

      const agrupamento = {};
      filtrados.forEach((p) => {
        const dia = new Date(p.data).toLocaleDateString("pt-BR");
        if (!agrupamento[dia]) agrupamento[dia] = { dia, faturamento: 0, pedidos: 0 };
        agrupamento[dia].faturamento += p.total || 0;
        agrupamento[dia].pedidos += 1;
      });

      const dadosOrdenados = Object.values(agrupamento).sort((a, b) => {
        const [diaA, mesA, anoA] = a.dia.split("/").map(Number);
        const [diaB, mesB, anoB] = b.dia.split("/").map(Number);
        return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
      });
      setDadosGrafico(dadosOrdenados);

      const pgto = {};
      filtrados.forEach((p) => {
        const f = p.formaPagamento || "Outros";
        pgto[f] = (pgto[f] || 0) + (p.total || 0);
      });
      setDadosPagamento(Object.entries(pgto).map(([name, value]) => ({ name, value })));
    };
    aplicarFiltro();
  }, [pedidos, filtro]);

  const alterarCargo = async (usuarioId, novoTipo) => {
    await updateDoc(doc(db, "usuarios", usuarioId), { tipo: novoTipo });
    setUsuarios(usuarios.map(u => u.id === usuarioId ? { ...u, tipo: novoTipo } : u));
  };

  const handleGerarPDF = () => {
    // Chamamos a função externa, passando os dados e as referências da tela
    gerarRelatorioPremium(pedidos, faturamento, quantidade, filtro, lineChartRef.current, pieChartRef.current);
  };

  const COLORS = ["#00ff66", "#8884d8", "#ffbb28", "#ff8042"];

  if (isDono === null) return <div className="cartao"><h2 className="dash-title"><FaSpinner /> Carregando Painel...</h2></div>;
  if (isDono === false) return <div className="cartao"><h2 className="dash-title" style={{ color: '#ff4444' }}><FaBan /> Acesso Negado</h2><button onClick={fechar} className="botao botao-vermelho">Sair</button></div>;

  return (
    <div className="cartao">
      <div style={{ marginBottom: "20px" }}>
        <h2 className="dash-title"><FaChartBar /> Dashboard Empresarial</h2>
      </div>

      <div className="dash-filtros">
        <label><b>Filtrar:</b>{" "}</label>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="dash-select">
          <option value="todos">Todo Período</option>
          <option value="hoje">Hoje</option>
          <option value="7dias">Últimos 7 Dias</option>
          <option value="mes">Mês Atual</option>
        </select>
      </div>

      <div className="dash-stats">
        <p><b>Total de Pedidos Entregues:</b> {quantidade}</p>
        <p><b>Faturamento Total:</b> R$ {faturamento.toFixed(2)}</p>
      </div>

      <h3 className="dash-h3"><FaChartLine /> Faturamento e Pedidos por Dia</h3>
      <div ref={lineChartRef} className="dash-grafico">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="dia" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: "#333", border: "none", color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#fff" }} />
            <Line type="monotone" dataKey="faturamento" stroke="#00ff66" strokeWidth={3} name="Faturamento (R$)" />
            <Line type="monotone" dataKey="pedidos" stroke="#8884d8" strokeWidth={3} name="Pedidos" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="dash-h3"><FaChartPie /> Faturamento por Forma de Pagamento</h3>
      <div ref={pieChartRef} className="dash-grafico">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={dadosPagamento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={{ fill: "#fff" }}>
              {dadosPagamento.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#333", border: "none", color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#fff" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <button onClick={handleGerarPDF} className="botao btn-pdf-full"><FaFilePdf /> Gerar Relatório Profissional</button>
      <hr className="dash-hr" />
      <GerenciamentoUsuarios usuarios={usuarios} alterarCargo={alterarCargo} loadingUsuarios={loadingUsuarios} />
    </div>
  );
}