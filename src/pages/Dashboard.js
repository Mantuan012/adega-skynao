import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import { FaSearch, FaUserShield, FaMotorcycle, FaUser } from "react-icons/fa";

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
  const [busca, setBusca] = useState("");
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  
  const [mostrarTodosUsuarios, setMostrarTodosUsuarios] = useState(false);

  const lineChartRef = useRef();
  const pieChartRef = useRef();

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuario) {
        setIsDono(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
      if (userDoc.exists() && userDoc.data().tipo === "admin") {
        setIsDono(true);

        const snapshotPedidos = await getDocs(collection(db, "pedidos"));
        const listaPedidos = snapshotPedidos.docs.map((doc) => doc.data());
        setPedidos(listaPedidos);

        const snapshotUsuarios = await getDocs(collection(db, "usuarios"));
        const listaUsuarios = snapshotUsuarios.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuarios(listaUsuarios);
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

      if (filtro === "hoje") {
        filtrados = filtrados.filter((p) => dayjs(p.data).isSame(agora, "day"));
      } else if (filtro === "7dias") {
        filtrados = filtrados.filter((p) => dayjs(p.data).isAfter(agora.subtract(7, "day")));
      } else if (filtro === "mes") {
        filtrados = filtrados.filter((p) => dayjs(p.data).isSame(agora, "month"));
      }

      const totalFaturado = filtrados.reduce((acc, p) => acc + (p.total || 0), 0);
      const totalPedidos = filtrados.length;

      setFaturamento(totalFaturado);
      setQuantidade(totalPedidos);

      const agrupamento = {};
      filtrados.forEach((pedido) => {
        const data = new Date(pedido.data);
        const dia = data.toLocaleDateString("pt-BR");

        if (!agrupamento[dia]) {
          agrupamento[dia] = { dia: dia, faturamento: 0, pedidos: 0 };
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

      const pagamento = {};
      filtrados.forEach((p) => {
        const forma = p.formaPagamento || "Não informado";
        if (!pagamento[forma]) pagamento[forma] = 0;
        pagamento[forma] += p.total || 0;
      });

      const pagamentoArray = Object.entries(pagamento).map(([forma, valor]) => ({
        name: forma,
        value: valor,
      }));

      setDadosPagamento(pagamentoArray);
    };

    aplicarFiltro();
  }, [pedidos, filtro]);

  const alterarCargo = async (usuarioId, novoTipo) => {
    try {
      const userRef = doc(db, "usuarios", usuarioId);
      await updateDoc(userRef, { tipo: novoTipo });
      setUsuarios(usuarios.map(u => u.id === usuarioId ? { ...u, tipo: novoTipo } : u));
    } catch (error) {
      console.error("Erro ao atualizar cargo:", error);
      alert("Erro ao atualizar o cargo. Verifique sua conexão.");
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const termoBusca = busca.toLowerCase();
    const nome = u.nome ? u.nome.toLowerCase() : "";
    const email = u.email ? u.email.toLowerCase() : "";
    return nome.includes(termoBusca) || email.includes(termoBusca);
  });

  const usuariosExibidos = mostrarTodosUsuarios ? usuariosFiltrados : usuariosFiltrados.slice(0, 5);

  const COLORS = ["#00ff66", "#8884d8", "#ffbb28", "#ff8042"];

  const gerarPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let yOffset = 20; 

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(0, 150, 50); 
    pdf.text("Relatório Gerencial - Adega Skynão", 105, yOffset, { align: "center" });
    yOffset += 12;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Documento emitido em: ${dayjs().format("DD/MM/YYYY às HH:mm")}`, 14, yOffset);
    yOffset += 6;
    pdf.text(`Período analisado: ${filtro === 'todos' ? 'Todo o Período' : filtro}`, 14, yOffset);
    yOffset += 15;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text("1. Resumo Financeiro e Operacional", 14, yOffset);
    yOffset += 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Total de Pedidos Entregues: ${quantidade} pedidos concluídos.`, 14, yOffset);
    yOffset += 8;
    pdf.text(`Faturamento Bruto no Período: R$ ${faturamento.toFixed(2)}`, 14, yOffset);
    yOffset += 15;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("2. Equipe Ativa no Sistema", 14, yOffset);
    yOffset += 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const funcionarios = usuarios.filter(u => u.tipo === "admin" || u.tipo === "entregador");
    
    if (funcionarios.length > 0) {
      funcionarios.forEach(func => {
        const cargo = func.tipo === 'admin' ? 'Administrador' : 'Entregador';
        pdf.text(`- ${func.nome || "Usuário s/ Nome"} | Função: ${cargo} | Contato: ${func.telefone || "Não informado"}`, 14, yOffset);
        yOffset += 7;
      });
    } else {
      pdf.text("Nenhum funcionário com cargo especial atribuído.", 14, yOffset);
      yOffset += 7;
    }
    yOffset += 15;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("3. Gráficos de Desempenho", 14, yOffset);
    yOffset += 10;

    try {
      if (lineChartRef.current) {
        const canvasLine = await html2canvas(lineChartRef.current, { scale: 2, backgroundColor: "#1e1e1e" });
        const imgLine = canvasLine.toDataURL("image/png");
        const imgWidth = 180;
        const imgHeight = (canvasLine.height * imgWidth) / canvasLine.width;
        
        if (yOffset + imgHeight > 280) {
          pdf.addPage();
          yOffset = 20;
        }
        pdf.addImage(imgLine, "PNG", 15, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 15;
      }

      if (pieChartRef.current) {
        const canvasPie = await html2canvas(pieChartRef.current, { scale: 2, backgroundColor: "#1e1e1e" });
        const imgPie = canvasPie.toDataURL("image/png");
        const imgWidth = 140;
        const imgHeight = (canvasPie.height * imgWidth) / canvasPie.width;
        
        if (yOffset + imgHeight > 280) {
          pdf.addPage();
          yOffset = 20;
        }
        pdf.addImage(imgPie, "PNG", 35, yOffset, imgWidth, imgHeight); 
      }
    } catch (error) {
      console.error("Erro ao gerar imagens dos gráficos para o PDF:", error);
    }

    pdf.save(`Relatorio-AdegaSkynao-${dayjs().format("DD-MM-YYYY")}.pdf`);
  };

  if (isDono === null) {
    return (
      <div className="cartao">
        <h2>⏳ Carregando Painel...</h2>
      </div>
    );
  }

  if (isDono === false) {
    return (
      <div className="cartao">
        <h2>🚫 Acesso Negado</h2>
        <p>Você não tem permissão para acessar este painel.</p>
        {/* Mantive o botão de fechar APENAS na tela de erro, para ele não ficar travado aqui */}
        <button onClick={fechar} className="botao botao-vermelho">Sair</button>
      </div>
    );
  }

  return (
    <div className="cartao">
      <div style={{ marginBottom: "20px" }}>
        <h2 className="titulo-principal" style={{ margin: 0 }}>📊 Dashboard Empresarial</h2>
      </div>

      <div>
        <label><b>Filtrar:</b>{" "}</label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            padding: "6px 10px", borderRadius: "6px", border: "1px solid #00ff66",
            backgroundColor: "#222", color: "#e0e0e0", marginLeft: "10px",
          }}
        >
          <option value="todos">Todo Período</option>
          <option value="hoje">Hoje</option>
          <option value="7dias">Últimos 7 Dias</option>
          <option value="mes">Mês Atual</option>
        </select>
      </div>

      <p><b>Total de Pedidos Entregues:</b> {quantidade}</p>
      <p><b>Faturamento Total:</b> R$ {faturamento.toFixed(2)}</p>

      <h3 style={{ marginTop: "20px", color: "#00ff66" }}>📈 Faturamento e Pedidos por Dia</h3>
      <div ref={lineChartRef} style={{ backgroundColor: "#1e1e1e", padding: "10px", borderRadius: "8px" }}>
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

      <h3 style={{ marginTop: "20px", color: "#00ff66" }}>🥧 Faturamento por Forma de Pagamento</h3>
      <div ref={pieChartRef} style={{ backgroundColor: "#1e1e1e", padding: "10px", borderRadius: "8px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={dadosPagamento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={{ fill: "#fff" }}>
              {dadosPagamento.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#333", border: "none", color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#fff" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={gerarPDF} className="botao" style={{ padding: "10px 20px" }}>
          🧾 Gerar Relatório PDF
        </button>
      </div>

      <hr style={{ borderColor: "#333", margin: "40px 0" }} />

      <h3 style={{ color: "#00ff66", marginBottom: "5px" }}>👥 Gestão de Equipe e Usuários</h3>
      <p style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "20px" }}>
        Pesquise usuários cadastrados e defina quem é administrador ou entregador no sistema.
      </p>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <FaSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#00ff66' }} />
        <input 
          type="text" 
          placeholder="Buscar usuário por nome ou e-mail..." 
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            if(e.target.value === "") setMostrarTodosUsuarios(false);
            else setMostrarTodosUsuarios(true);
          }}
          style={{
            width: '100%', padding: '10px 10px 10px 35px', borderRadius: '20px',
            border: '1px solid #00ff66', backgroundColor: '#222', color: '#fff',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

      {loadingUsuarios ? (
        <p style={{ textAlign: "center", color: "#888" }}>Carregando dados do servidor...</p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: "10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #00ff66" }}>
                <th style={{ padding: "10px" }}>Nome / Email</th>
                <th style={{ padding: "10px" }}>Cargo Atual</th>
                <th style={{ padding: "10px" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosExibidos.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #333" }}>
                  <td style={{ padding: "10px" }}>
                    <strong>{u.nome || "Cadastro Incompleto"}</strong><br/>
                    <span style={{ fontSize: "0.8rem", color: "#888" }}>{u.email}</span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    {u.tipo === "admin" ? <span style={{ color: "#ff4444" }}><FaUserShield/> Admin</span> :
                     u.tipo === "entregador" ? <span style={{ color: "#00ff66" }}><FaMotorcycle/> Entregador</span> :
                     <span style={{ color: "#aaa" }}><FaUser/> Cliente</span>}
                  </td>
                  <td style={{ padding: "10px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {u.tipo !== "admin" && (
                      <button 
                        onClick={() => alterarCargo(u.id, "admin")}
                        className="botao" style={{ padding: "5px 10px", fontSize: "0.8rem", backgroundColor: "#ff4444", border: "none" }}>
                        Dar Admin
                      </button>
                    )}
                    {u.tipo !== "entregador" && (
                      <button 
                        onClick={() => alterarCargo(u.id, "entregador")}
                        className="botao" style={{ padding: "5px 10px", fontSize: "0.8rem" }}>
                        Tornar Entregador
                      </button>
                    )}
                    {(u.tipo === "entregador" || u.tipo === "admin") && (
                      <button 
                        onClick={() => alterarCargo(u.id, "cliente")}
                        className="botao botao-vermelho" style={{ padding: "5px 10px", fontSize: "0.8rem" }}>
                        Rebaixar a Cliente
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {usuariosExibidos.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {!busca && usuariosFiltrados.length > 5 && (
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button 
                onClick={() => setMostrarTodosUsuarios(!mostrarTodosUsuarios)}
                style={{
                  background: "transparent", color: "#00ff66", border: "1px solid #00ff66",
                  padding: "8px 15px", borderRadius: "15px", cursor: "pointer", fontSize: "0.9rem"
                }}
              >
                {mostrarTodosUsuarios ? "Ver Menos" : `Ver Todos (${usuariosFiltrados.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}