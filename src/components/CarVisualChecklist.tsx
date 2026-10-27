import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  AlertCircle,
  Camera,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { DamageItem, Checklist, Budget } from '../types';

interface Props {
  onBudgetCreated: (budgetId: string) => void;
  onNavigateToTasks: () => void;
}

const ITENS_CARROCERIA_PADRAO = [
  'Para-choque dianteiro',
  'Capô',
  'Para-lama dianteiro esquerdo',
  'Para-lama dianteiro direito',
  'Porta dianteira esquerda',
  'Porta dianteira direita',
  'Teto',
  'Porta traseira esquerda',
  'Porta traseira direita',
  'Para-lama traseiro esquerdo',
  'Para-lama traseiro direito',
  'Tampa traseira / Porta-malas',
  'Para-choque traseiro',
  'Farol dianteiro esquerdo',
  'Farol dianteiro direito',
  'Lanterna traseira esquerda',
  'Lanterna traseira direita',
  'Para-brisa',
  'Vidro traseiro',
  'Vidros laterais',
  'Rodas e Pneus',
  'Interior (Bancos e Painel)',
  'Retrovisores',
];

const STATUS_AVARIAS = [
  'Sem avaria',
  'Amassado',
  'Arranhado',
  'Trincado',
  'Precisa pintura',
  'Precisa troca',
];

export const CarVisualChecklist: React.FC<Props> = ({ onBudgetCreated, onNavigateToTasks }) => {
  const { clients, vehicles, services, saveBudget, generateTasksFromChecklist } = useTasks();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [combustivel, setCombustivel] = useState('Full');
  const [km, setKm] = useState('');
  const [itensDeixados, setItensDeixados] = useState('Manual do proprietário, chave reserva, macaco e estepe');
  const [partesAvariadas, setPartesAvariadas] = useState<string[]>(['capô', 'porta-le']);
  const [openItemIdx, setOpenItemIdx] = useState<number | null>(0);
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'R$' | '%'>('R$');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [damageItems, setDamageItems] = useState<DamageItem[]>(() =>
    ITENS_CARROCERIA_PADRAO.map((nome) => ({
      nome,
      status: nome === 'Capô' ? 'Amassado' : nome === 'Porta dianteira esquerda' ? 'Arranhado' : 'Sem avaria',
      observacao: '',
      fotos: [],
      servicos:
        nome === 'Capô'
          ? [{ nome: 'Martelinho de ouro', qtd: 1, valor: 180 }]
          : nome === 'Porta dianteira esquerda'
          ? [{ nome: 'Pintura de peça (Para-choque/Porta)', qtd: 1, valor: 450 }]
          : [],
    }))
  );

  const availableVehicles = vehicles.filter((v) => !selectedClientId || v.clienteId === selectedClientId);

  const togglePart = (partKey: string) => {
    if (partesAvariadas.includes(partKey)) {
      setPartesAvariadas(partesAvariadas.filter((p) => p !== partKey));
    } else {
      setPartesAvariadas([...partesAvariadas, partKey]);
    }
  };

  const handleStatusChange = (idx: number, status: string) => {
    const updated = [...damageItems];
    updated[idx].status = status;
    setDamageItems(updated);
  };

  const handleObsChange = (idx: number, val: string) => {
    const updated = [...damageItems];
    updated[idx].observacao = val;
    setDamageItems(updated);
  };

  const handleAddService = (idx: number) => {
    const updated = [...damageItems];
    updated[idx].servicos.push({
      nome: services[0]?.nome || 'Martelinho de ouro',
      qtd: 1,
      valor: services[0]?.preco || 180,
    });
    setDamageItems(updated);
  };

  const handleRemoveService = (itemIdx: number, srvIdx: number) => {
    const updated = [...damageItems];
    updated[itemIdx].servicos.splice(srvIdx, 1);
    setDamageItems(updated);
  };

  const handleServiceSelect = (itemIdx: number, srvIdx: number, srvName: string) => {
    const updated = [...damageItems];
    const srv = services.find((s) => s.nome === srvName);
    updated[itemIdx].servicos[srvIdx].nome = srvName;
    if (srv) {
      updated[itemIdx].servicos[srvIdx].valor = srv.preco;
    }
    setDamageItems(updated);
  };

  // Subtotal & Total
  const subtotal = damageItems.reduce((acc, item) => {
    const itemTotal = item.servicos.reduce((sAcc, s) => sAcc + s.qtd * s.valor, 0);
    return acc + itemTotal;
  }, 0);

  const discountCalculated = discountType === '%' ? (subtotal * discountVal) / 100 : discountVal;
  const total = Math.max(0, subtotal - discountCalculated);

  const handleGenerateTasks = async () => {
    const client = clients.find((c) => c.id === selectedClientId) || clients[0];
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

    if (!client || !vehicle) {
      alert('Selecione ou cadastre ao menos um cliente e veículo.');
      return;
    }

    const currentChecklist: Checklist = {
      id: 'ck_' + Date.now(),
      clienteId: client.id,
      veiculoId: vehicle.id,
      data: new Date().toISOString(),
      combustivel,
      km,
      itens: itensDeixados,
      partesVisuais: partesAvariadas,
      itensCarroceria: damageItems,
      subtotal,
      desconto: discountCalculated,
      total,
    };

    const count = await generateTasksFromChecklist(currentChecklist, client, vehicle);
    setSuccessMessage(`${count} nova(s) pendência(s) de serviço gerada(s) no Quadro em Tempo Real!`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleCreateBudget = () => {
    const client = clients.find((c) => c.id === selectedClientId) || clients[0];
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

    if (!client || !vehicle) {
      alert('Selecione ou cadastre ao menos um cliente e veículo.');
      return;
    }

    const lines: Budget['itens'] = [];
    damageItems.forEach((it) => {
      it.servicos.forEach((s) => {
        lines.push({
          peca: it.nome,
          servico: s.nome,
          qtd: s.qtd,
          valor: s.valor,
        });
      });
    });

    const newBudget: Budget = {
      id: 'orc_' + Date.now(),
      numero: 1000 + Math.floor(Math.random() * 900),
      clienteId: client.id,
      veiculoId: vehicle.id,
      data: new Date().toISOString(),
      subtotal,
      desconto: discountCalculated,
      total,
      status: 'rascunho',
      itens: lines,
    };

    saveBudget(newBudget);
    onBudgetCreated(newBudget.id);
  };

  return (
    <div className="space-y-6">
      {/* Alert banner on success */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white font-semibold flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={onNavigateToTasks}
            className="px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50"
          >
            Ver Quadro &rarr;
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Recepção & Vistoria</span>
          <h2 className="text-xl font-bold text-slate-900">Checklist e Mapeamento de Danos do Veículo</h2>
          <p className="text-xs text-slate-500">Toque nas partes do veículo para registrar avarias e gerar pendências</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateTasks}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Gerar Pendências no Quadro
          </button>
          <button
            onClick={handleCreateBudget}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-700/20 transition-all"
          >
            <FileText className="w-4 h-4" /> Gerar Orçamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive 2D Car Schematic */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Esquema da Carroceria</span>
            <span className="text-[11px] text-slate-400">Toque para marcar avaria</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 w-full flex items-center justify-center my-3">
            <svg
              className="w-full max-w-[240px] drop-shadow-sm select-none"
              viewBox="0 0 200 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Hood / Capô */}
              <rect
                onClick={() => togglePart('capô')}
                x="60"
                y="20"
                width="80"
                height="50"
                rx="8"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('capô')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <text x="100" y="50" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b" pointerEvents="none">
                Capô
              </text>

              {/* Windshield */}
              <rect
                onClick={() => togglePart('para-brisa')}
                x="55"
                y="75"
                width="90"
                height="30"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('para-brisa')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-sky-100 stroke-slate-500 hover:fill-sky-200'
                }`}
              />

              {/* Roof / Teto */}
              <rect
                onClick={() => togglePart('teto')}
                x="55"
                y="110"
                width="90"
                height="60"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('teto')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <text x="100" y="145" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e293b" pointerEvents="none">
                Teto
              </text>

              {/* Left Side Panels */}
              <rect
                onClick={() => togglePart('para-lama-ld')}
                x="30"
                y="20"
                width="25"
                height="50"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('para-lama-ld')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <rect
                onClick={() => togglePart('porta-le')}
                x="30"
                y="110"
                width="25"
                height="60"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('porta-le')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <rect
                onClick={() => togglePart('porta-re')}
                x="30"
                y="175"
                width="25"
                height="55"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('porta-re')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <rect
                onClick={() => togglePart('para-lama-lt')}
                x="30"
                y="235"
                width="25"
                height="50"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('para-lama-lt')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />

              {/* Right Side Panels */}
              <rect
                onClick={() => togglePart('para-lama-rd')}
                x="145"
                y="20"
                width="25"
                height="50"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('para-lama-rd')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <rect
                onClick={() => togglePart('porta-lado')}
                x="145"
                y="110"
                width="25"
                height="60"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('porta-lado')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <rect
                onClick={() => togglePart('porta-ld')}
                x="145"
                y="175"
                width="25"
                height="55"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('porta-ld')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <rect
                onClick={() => togglePart('para-lama-lt2')}
                x="145"
                y="235"
                width="25"
                height="50"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('para-lama-lt2')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />

              {/* Rear Windshield */}
              <rect
                onClick={() => togglePart('vidro-tras')}
                x="55"
                y="175"
                width="90"
                height="30"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('vidro-tras')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-sky-100 stroke-slate-500 hover:fill-sky-200'
                }`}
              />

              {/* Trunk / Tampa Traseira */}
              <rect
                onClick={() => togglePart('tampa-tras')}
                x="60"
                y="210"
                width="80"
                height="40"
                rx="8"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('tampa-tras')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <text x="100" y="235" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b" pointerEvents="none">
                Tampa tr.
              </text>

              {/* Rear Bumper */}
              <rect
                onClick={() => togglePart('parach-td')}
                x="55"
                y="255"
                width="90"
                height="25"
                rx="4"
                className={`cursor-pointer transition-all ${
                  partesAvariadas.includes('parach-td')
                    ? 'fill-rose-300 stroke-rose-600 stroke-2'
                    : 'fill-slate-300 stroke-slate-500 hover:fill-blue-200'
                }`}
              />
              <text x="100" y="272" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e293b" pointerEvents="none">
                P-choque tr.
              </text>

              {/* Headlights */}
              <circle
                onClick={() => togglePart('farol-de')}
                cx="70"
                cy="30"
                r="8"
                className={`cursor-pointer ${partesAvariadas.includes('farol-de') ? 'fill-rose-400' : 'fill-amber-200 stroke-slate-600'}`}
              />
              <circle
                onClick={() => togglePart('farol-dd')}
                cx="130"
                cy="30"
                r="8"
                className={`cursor-pointer ${partesAvariadas.includes('farol-dd') ? 'fill-rose-400' : 'fill-amber-200 stroke-slate-600'}`}
              />

              {/* Taillights */}
              <circle
                onClick={() => togglePart('lanterna-te')}
                cx="70"
                cy="270"
                r="8"
                className={`cursor-pointer ${partesAvariadas.includes('lanterna-te') ? 'fill-rose-500' : 'fill-rose-400/50 stroke-slate-600'}`}
              />
              <circle
                onClick={() => togglePart('lanterna-td')}
                cx="130"
                cy="270"
                r="8"
                className={`cursor-pointer ${partesAvariadas.includes('lanterna-td') ? 'fill-rose-500' : 'fill-rose-400/50 stroke-slate-600'}`}
              />
            </svg>
          </div>

          {/* Vehicle General Info */}
          <div className="w-full space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cliente
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  const firstV = vehicles.find((v) => v.clienteId === e.target.value);
                  if (firstV) setSelectedVehicleId(firstV.id);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="">Selecione o cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.tel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Veículo
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
              >
                <option value="">Selecione o veículo...</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Combustível
                </label>
                <select
                  value={combustivel}
                  onChange={(e) => setCombustivel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option>Reserva</option>
                  <option>1/4</option>
                  <option>1/2</option>
                  <option>3/4</option>
                  <option>Full</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  KM Atual
                </label>
                <input
                  type="text"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="Ex: 45.000"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Itens deixados no carro
              </label>
              <textarea
                rows={2}
                value={itensDeixados}
                onChange={(e) => setItensDeixados(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Body Parts Damage Checklist & Associated Repair Services */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Itens e Peças da Carroceria</h3>
              <p className="text-xs text-slate-500">Defina os danos e serviços necessários para cada componente</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {damageItems.filter((i) => i.status !== 'Sem avaria').length} peça(s) com avaria
            </span>
          </div>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {damageItems.map((item, idx) => {
              const isOpen = openItemIdx === idx;
              const hasDamage = item.status !== 'Sem avaria';

              return (
                <div
                  key={item.nome}
                  className={`bg-white rounded-xl border transition-all overflow-hidden ${
                    hasDamage ? 'border-amber-300 shadow-sm' : 'border-slate-200/80'
                  }`}
                >
                  {/* Item Accordion Header */}
                  <div
                    onClick={() => setOpenItemIdx(isOpen ? null : idx)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${hasDamage ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                      <span className="text-sm font-bold text-slate-800">{item.nome}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasDamage ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.servicos.length > 0 && (
                        <span className="text-xs font-bold text-blue-700">
                          {item.servicos.length} serviço(s)
                        </span>
                      )}
                      <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Item Body */}
                  {isOpen && (
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Tipo de Avaria / Diagnóstico:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {STATUS_AVARIAS.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(idx, st)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                item.status === st
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Observações do Funileiro / Pintor:
                        </label>
                        <textarea
                          rows={2}
                          value={item.observacao}
                          onChange={(e) => handleObsChange(idx, e.target.value)}
                          placeholder="Detalhes específicos da deformação, profundidade do risco ou peça a ser substituída..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                      </div>

                      {/* Associated Services */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Serviços Necessários nesta Peça:
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddService(idx)}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-md flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Adicionar Serviço
                          </button>
                        </div>

                        {item.servicos.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                            Nenhum serviço vinculado a esta peça ainda.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {item.servicos.map((srv, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200"
                              >
                                <select
                                  value={srv.nome}
                                  onChange={(e) => handleServiceSelect(idx, sIdx, e.target.value)}
                                  className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                                >
                                  {services.map((s) => (
                                    <option key={s.id} value={s.nome}>
                                      {s.nome}
                                    </option>
                                  ))}
                                </select>

                                <div className="flex items-center gap-1 w-20">
                                  <span className="text-[10px] text-slate-400">Qtd:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={srv.qtd}
                                    onChange={(e) => {
                                      const updated = [...damageItems];
                                      updated[idx].servicos[sIdx].qtd = Number(e.target.value) || 1;
                                      setDamageItems(updated);
                                    }}
                                    className="w-full px-1.5 py-1 rounded border border-slate-200 text-xs text-center"
                                  />
                                </div>

                                <div className="flex items-center gap-1 w-24">
                                  <span className="text-[10px] text-slate-400">R$:</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={srv.valor}
                                    onChange={(e) => {
                                      const updated = [...damageItems];
                                      updated[idx].servicos[sIdx].valor = Number(e.target.value) || 0;
                                      setDamageItems(updated);
                                    }}
                                    className="w-full px-1.5 py-1 rounded border border-slate-200 text-xs"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveService(idx, sIdx)}
                                  className="text-slate-400 hover:text-rose-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Budget Subtotal & Discounts Bar */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Subtotal</span>
                <span className="text-lg font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Desconto</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={discountVal}
                      onChange={(e) => setDiscountVal(Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      placeholder="0"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="px-1.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="R$">R$</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-emerald-400 uppercase tracking-wider block font-bold">TOTAL GERAL</span>
                <span className="text-2xl font-black text-emerald-400">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleGenerateTasks}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                Gerar Pendências
              </button>
              <button
                type="button"
                onClick={handleCreateBudget}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Salvar Orçamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
