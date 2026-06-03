import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Activity, Server, ArrowLeft, Plus, X, Network, ClipboardList } from 'lucide-react';
import TaskDashboard from './components/TaskDashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- IMPORTAÇÕES DO REACT FLOW (NOVO) ---
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

  useEffect(() => {
    fetchServices();
  }, []);

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
      alert("Erro ao criar o serviço. Verifique o console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2><Server size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Microsserviços Ativos</h2>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
        >
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

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '8px', width: '400px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Registrar Novo Serviço</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>Nome do Serviço</label>
                <input type="text" required value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '4px', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>Ambiente</label>
                <select value={newServiceEnv} onChange={(e) => setNewServiceEnv(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '4px', color: 'white' }}>
                  <option value="Development">Development</option>
                  <option value="Staging">Staging</option>
                  <option value="Production">Production</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', backgroundColor: 'transparent', color: '#ccc', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>{isSubmitting ? 'Registrando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      } catch (err) {
        setMetrics([{ time: '10:00', cpu: 45.2, memory: 60.1 }, { time: '10:05', cpu: 55.0, memory: 62.4 }, { time: '10:10', cpu: 88.5, memory: 70.2 }, { time: '10:15', cpu: 65.1, memory: 68.9 }, { time: '10:20', cpu: 48.3, memory: 63.5 }]);
      }
    };
    fetchMetrics();
  }, [id]);

  return (
    <div>
      <Link to="/" style={{ color: '#61dafb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: '25px', padding: '5px 10px', backgroundColor: '#1e1e1e', borderRadius: '5px' }}>
        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Voltar para o Hub
      </Link>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', margin: '0 0 10px 0' }}><Activity size={28} style={{ marginRight: '10px', color: '#4caf50' }} /> Dashboard SRE</h2>
        <p style={{ fontFamily: 'monospace', color: '#888', margin: 0 }}>Target ID: {id}</p>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '20px', height: '400px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#ccc', fontWeight: 'normal' }}>Consumo de Recursos (% CPU / Memória)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics} margin={{ top: 10, right: 30, left: -10, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="time" stroke="#888" tick={{ fill: '#888' }} tickMargin={10} />
            <YAxis stroke="#888" tick={{ fill: '#888' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '5px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
            <Line type="monotone" dataKey="cpu" stroke="#ff7300" strokeWidth={3} name="CPU Usage" dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="memory" stroke="#8884d8" strokeWidth={3} name="Memory Usage" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- PÁGINA 3: MAPA DE TOPOLOGIA ---
function TopologyMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const response = await axios.get('/api/Topology');
        const data = response.data;

        const mappedEdges = data.edges.map((edge, index) => ({
          id: edge.id ?? `e-${edge.source}-${edge.target}-${index}`,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: true,
          style: { stroke: '#4caf50', strokeWidth: 2 },
          labelStyle: { fill: '#888', fontSize: 11 },
          labelBgStyle: { fill: '#1e1e1e' },
        }));

        setNodes(data.nodes);
        setEdges(mappedEdges);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar topologia:', err);
        setError('Falha ao conectar na API de Topologia. Verifique se o backend está rodando em localhost:5223.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopology();
  }, [setNodes, setEdges]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', margin: '0 0 10px 0' }}>
          <Network size={28} style={{ marginRight: '10px', color: '#9c27b0' }} />
          Topologia da Malha
        </h2>
        <p style={{ color: '#888', margin: 0 }}>Dependências entre microsserviços — dados em tempo real via Neo4j</p>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#3a1c1c', color: '#ff6b6b', border: '1px solid #ff4c4c', borderRadius: '5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ height: '600px', backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', zIndex: 10 }}>
            Carregando topologia...
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          colorMode="dark"
          fitView
        >
          <Controls style={{ backgroundColor: '#2d2d2d', fill: '#fff' }} />
          <MiniMap nodeColor="#4caf50" maskColor="rgba(0,0,0,0.7)" style={{ backgroundColor: '#1e1e1e' }} />
          <Background variant="dots" gap={16} size={1} color="#333" />
        </ReactFlow>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL COM NAVEGAÇÃO GLOBAL ---
function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#e0e0e0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Header com Menu de Navegação */}
        <header style={{ backgroundColor: '#0a0a0a', padding: '15px 40px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Activity color="#61dafb" size={32} style={{ marginRight: '15px' }} />
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', letterSpacing: '1px' }}>
              CloudPulse <span style={{ color: '#61dafb', fontWeight: '300' }}>Observer</span>
            </h1>
          </div>
          
          <nav style={{ display: 'flex', gap: '20px' }}>
            <Link to="/" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} /> Hub de Serviços
            </Link>
            <Link to="/topology" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={18} /> Topologia
            </Link>
            <Link to="/tasks" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} /> Tarefas
            </Link>
          </nav>
        </header>

        <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<ServiceList />} />
            <Route path="/service/:id" element={<ServiceDashboard />} />
            <Route path="/topology" element={<TopologyMap />} />
            <Route path="/tasks" element={<TaskDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
