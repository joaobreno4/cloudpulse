import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, RefreshCw, AlertCircle } from 'lucide-react';

const STATUS_STYLE = {
  Running:   { color: '#4caf50', background: '#1a3320' },
  Pending:   { color: '#ff9800', background: '#332200' },
  Completed: { color: '#61dafb', background: '#0d2233' },
  Failed:    { color: '#ff5252', background: '#3a1010' },
};

const REFRESH_INTERVAL_MS = 5000;

function StatusBadge({ status }) {
  const style = STATUS_STYLE[status] ?? { color: '#aaa', background: '#222' };
  return (
    <span style={{
      ...style,
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.4px',
      display: 'inline-block',
    }}>
      {status}
    </span>
  );
}

function CpuBar({ value }) {
  const color = value > 70 ? '#ff5252' : value > 40 ? '#ff9800' : '#4caf50';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '6px', backgroundColor: '#2d2d2d', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '12px', color: '#aaa', minWidth: '38px', textAlign: 'right', fontFamily: 'monospace' }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

export default function TaskDashboard() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const url = `${import.meta.env.VITE_CORE_API_URL}/tasks`;
      const { data } = await axios.get(url);
      setTasks(data);
      setError(null);
      setLastFetch(new Date());
    } catch (err) {
      setError('Falha ao buscar tarefas na API Core. Verifique se o serviço está rodando.');
      console.error('[TaskDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchTasks]);

  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', margin: '0 0 6px 0' }}>
            <ClipboardList size={26} style={{ marginRight: '10px', color: '#61dafb' }} />
            Monitoramento de Tarefas
          </h2>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
            Processos internos do cluster — atualiza a cada {REFRESH_INTERVAL_MS / 1000}s
          </p>
        </div>
        <button
          onClick={fetchTasks}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '6px', color: '#ccc', cursor: 'pointer', fontSize: '13px' }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {Object.entries(STATUS_STYLE).map(([status, style]) => (
          <div key={status} style={{ backgroundColor: '#1e1e1e', border: `1px solid ${style.color}33`, borderRadius: '8px', padding: '14px 18px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{status}</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: style.color }}>{counts[status] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: '#3a1010', color: '#ff5252', border: '1px solid #ff4c4c', borderRadius: '6px', marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}>
              {['Tarefa', 'Status', 'CPU Usage', 'Última atualização'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#888', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Carregando tarefas...</td>
              </tr>
            )}
            {!loading && tasks.length === 0 && !error && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Nenhuma tarefa encontrada.</td>
              </tr>
            )}
            {tasks.map((task, i) => (
              <tr
                key={task.name}
                style={{ borderBottom: i < tasks.length - 1 ? '1px solid #2a2a2a' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#252525'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: '#e0e0e0' }}>{task.name}</td>
                <td style={{ padding: '14px 20px' }}><StatusBadge status={task.status} /></td>
                <td style={{ padding: '14px 20px', minWidth: '160px' }}>
                  {task.cpuUsage > 0 ? <CpuBar value={task.cpuUsage} /> : <span style={{ color: '#555', fontSize: '12px' }}>—</span>}
                </td>
                <td style={{ padding: '14px 20px', color: '#888', fontSize: '12px', fontFamily: 'monospace' }}>
                  {new Date(task.updatedAt).toLocaleTimeString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lastFetch && (
          <div style={{ padding: '8px 20px', borderTop: '1px solid #2a2a2a', fontSize: '11px', color: '#555', textAlign: 'right' }}>
            Última busca: {lastFetch.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  );
}
