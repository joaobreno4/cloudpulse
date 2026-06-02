import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Activity, Server, ArrowLeft, Plus, X, Network } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- PÁGINA 1: LISTAGEM DE SERVIÇOS ---
function ServiceList() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceEnv, setNewServiceEnv] = useState('Development');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      const url = `${import.meta.env.VITE_CORE_API_URL}/Services`;
      const response = await axios.get(url);
      setServices(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro:", err);
      setError("Falha ao conectar na API Core (.NET). Verifique se o container está rodando.");
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = `${import.meta.env.VITE_CORE_API_URL}/Services`;
      await axios.post(url, { name: newServiceName, environment: newServiceEnv });
      setNewServiceName('');
      setNewServiceEnv('Development');
      setIsModalOpen(false);
      fetchServices(); 
    } catch (err) {
      console.error("Erro ao criar serviço:", err);
      alert("Erro ao criar o serviço.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2><Server size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Microsserviços Ativos</h2>
        <button onClick={() => setIsModalOpen(true)} style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Plus size={16} style={{ marginRight: '5px' }} /> Novo Serviço
        </button>
      </div>
      {error && <div style={{ padding: '15px', backgroundColor: '#3a1c1c', color: '#ff6b6b', border: '1px solid #ff4c4c', borderRadius: '5px', marginBottom: '20px' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {services.map(srv => (
          <div key={srv.id} style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#61dafb', display: 'flex', alignItems: 'center' }}>{srv.name}</h3>
            <p><strong>Ambiente:</strong> <span style={{ color: srv.environment === 'Production' ? '#4caf50' : '#ff9800' }}>{srv.environment}</span></p>
            <p><strong>Status:</strong> {srv.status}</p>
            <p style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>ID: {srv.id}</p>
            <Link to={`/service/${srv.id}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px', padding: '10px', backgroundColor: '#2d2d2d', color: '#e0e0e0', textDecoration: 'none', borderRadius: '5px' }}>
              <Activity size={18} style={{ marginRight: '8px' }} /> Ver Telemetria
            </Link>
          </div>
        ))}
        {services.length === 0 && !error && <p style={{ color: '#888' }}>Nenhum serviço encontrado no banco de dados.</p>}
      </div>
      {/* Modal omitido para brevidade */}
    </div>
  );
}

// --- PÁGINA 2: DASHBOARD DE TELEMETRIA ---
function ServiceDashboard() {
  const { id } = useParams();
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const url = `${import.meta.env.VITE_METRICS_API_URL}/metrics/aggregate/${id}`;
        const response = await axios.get(url);
        setMetrics(Array.isArray(response.data) ? response.data : []);
      } catch (err) { setMetrics([]); }
    };
    fetchMetrics();
  }, [id]);

  return (
    <div>
      <Link to="/" style={{ color: '#61dafb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: '25px', padding: '5px 10px', backgroundColor: '#1e1e1e', borderRadius: '5px' }}>
        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Voltar para o Hub
      </Link>
      <div style={{ height: '400px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics} margin={{ top: 10, right: 30, left: -10, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="time" stroke="#888" tickMargin={10} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #444', color: '#fff' }} />
            <Line type="monotone" dataKey="cpu" stroke="#ff7300" strokeWidth={3} />
            <Line type="monotone" dataKey="memory" stroke="#8884d8" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- PÁGINA 3: MAPA DE TOPOLOGIA (REAL NEO4J) ---
function TopologyMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const url = `${import.meta.env.VITE_CORE_API_URL}/Topology`;
        const response = await axios.get(url);
        setNodes(response.data.nodes || []);
        setEdges(response.data.edges || []);
      } catch (err) { console.error("Erro Neo4j:", err); } 
      finally { setLoading(false); }
    };
    fetchTopology();
  }, [setNodes, setEdges]);

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center' }}><Network size={28} style={{ marginRight: '10px' }} /> Topologia da Malha</h2>
      <div style={{ height: '600px', backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}>
        {loading ? <div style={{ color: '#61dafb', textAlign: 'center', marginTop: '20%' }}>Mapeando rede...</div> : 
         <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} colorMode="dark" fitView>
           <Controls /> <MiniMap /> <Background />
         </ReactFlow>
        }
      </div>
    </div>
  );
}

// --- APP ---
function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#e0e0e0', fontFamily: 'system-ui' }}>
        <header style={{ padding: '15px 40px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
          <h1>CloudPulse <span style={{ color: '#61dafb' }}>Observer</span></h1>
          <nav style={{ display: 'flex', gap: '20px' }}>
            <Link to="/">Hub de Serviços</Link>
            <Link to="/topology">Topologia</Link>
          </nav>
        </header>
        <main style={{ padding: '40px' }}>
          <Routes>
            <Route path="/" element={<ServiceList />} />
            <Route path="/service/:id" element={<ServiceDashboard />} />
            <Route path="/topology" element={<TopologyMap />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
