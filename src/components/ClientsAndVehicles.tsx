import React, { useState } from 'react';
import {
  Users,
  Car,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Client, Vehicle } from '../types';

interface Props {
  onNewTaskForVehicle?: (plate: string, clientName: string) => void;
}

export const ClientsAndVehicles: React.FC<Props> = ({ onNewTaskForVehicle }) => {
  const { clients, vehicles, tasks, addClient, updateClient, deleteClient, addVehicle, updateVehicle, deleteVehicle } =
    useTasks();

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);

  // Client modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [cNome, setCNome] = useState('');
  const [cDoc, setCDoc] = useState('');
  const [cTel, setCTel] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cEnd, setCEnd] = useState('');

  // Vehicle modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vPlaca, setVPlaca] = useState('');
  const [vMarca, setVMarca] = useState('');
  const [vModelo, setVModelo] = useState('');
  const [vAno, setVAno] = useState('');
  const [vCor, setVCor] = useState('');
  const [vKm, setVKm] = useState('');

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const clientVehicles = vehicles.filter((v) => v.clienteId === c.id);
    const plates = clientVehicles.map((v) => v.placa.toLowerCase()).join(' ');
    return c.nome.toLowerCase().includes(q) || c.tel.includes(q) || plates.includes(q);
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) || filteredClients[0];
  const clientVehicles = selectedClient ? vehicles.filter((v) => v.clienteId === selectedClient.id) : [];
  const clientTasks = selectedClient
    ? tasks.filter((t) => t.clientName?.toLowerCase() === selectedClient.nome.toLowerCase())
    : [];

  const handleOpenClientModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setCNome(client.nome);
      setCDoc(client.doc || '');
      setCTel(client.tel);
      setCEmail(client.email || '');
      setCEnd(client.end || '');
    } else {
      setEditingClient(null);
      setCNome('');
      setCDoc('');
      setCTel('');
      setCEmail('');
      setCEnd('');
    }
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNome.trim() || !cTel.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        nome: cNome.trim(),
        doc: cDoc.trim(),
        tel: cTel.trim(),
        email: cEmail.trim(),
        end: cEnd.trim(),
      });
    } else {
      const created = addClient({
        nome: cNome.trim(),
        doc: cDoc.trim(),
        tel: cTel.trim(),
        email: cEmail.trim(),
        end: cEnd.trim(),
      });
      setSelectedClientId(created.id);
    }
    setIsClientModalOpen(false);
  };

  const handleOpenVehicleModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVPlaca(vehicle.placa);
      setVMarca(vehicle.marca);
      setVModelo(vehicle.modelo);
      setVAno(vehicle.ano || '');
      setVCor(vehicle.cor || '');
      setVKm(vehicle.km || '');
    } else {
      setEditingVehicle(null);
      setVPlaca('');
      setVMarca('');
      setVModelo('');
      setVAno('2022');
      setVCor('');
      setVKm('');
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vPlaca.trim() || !vMarca.trim() || !vModelo.trim() || !selectedClient) return;

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        placa: vPlaca.trim().toUpperCase(),
        marca: vMarca.trim(),
        modelo: vModelo.trim(),
        ano: vAno.trim(),
        cor: vCor.trim(),
        km: vKm.trim(),
      });
    } else {
      addVehicle({
        clienteId: selectedClient.id,
        placa: vPlaca.trim().toUpperCase(),
        marca: vMarca.trim(),
        modelo: vModelo.trim(),
        ano: vAno.trim(),
        cor: vCor.trim(),
        km: vKm.trim(),
      });
    }
    setIsVehicleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Base de Dados</span>
          <h2 className="text-xl font-bold text-slate-900">Clientes & Veículos da Oficina</h2>
          <p className="text-xs text-slate-500">Histórico de veículos, ordens e pendências por cliente</p>
        </div>

        <button
          onClick={() => handleOpenClientModal()}
          className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-700/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client list */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[75vh]">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, placa ou tel..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Nenhum cliente cadastrado.</div>
            ) : (
              filteredClients.map((c) => {
                const cVeics = vehicles.filter((v) => v.clienteId === c.id);
                const isSelected = selectedClient?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{c.nome}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {c.tel}
                      </p>
                      <span className="text-[11px] text-blue-600 font-medium block mt-1">
                        🚗 {cVeics.length} veículo(s) cadastrado(s)
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Client Details & Vehicles */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              {/* Client Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedClient.nome}</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedClient.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenClientModal(selectedClient)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir o cliente ${selectedClient.nome} e seus veículos?`)) {
                          deleteClient(selectedClient.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span><strong>Telefone:</strong> {selectedClient.tel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span><strong>CPF/CNPJ:</strong> {selectedClient.doc || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span><strong>E-mail:</strong> {selectedClient.email || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="truncate"><strong>Endereço:</strong> {selectedClient.end || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Vehicles of this client */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <h4 className="text-base font-bold text-slate-900">Veículos do Cliente</h4>
                  </div>
                  <button
                    onClick={() => handleOpenVehicleModal()}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Veículo
                  </button>
                </div>

                {clientVehicles.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    Nenhum veículo cadastrado para este cliente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clientVehicles.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                            {v.placa}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenVehicleModal(v)}
                              className="p-1 text-slate-400 hover:text-blue-600"
                              title="Editar Veículo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteVehicle(v.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Excluir Veículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-bold text-slate-800">{v.marca} {v.modelo}</h5>
                          <p className="text-xs text-slate-500">
                            Ano: {v.ano || '-'} • Cor: {v.cor || '-'} • KM: {v.km || '-'}
                          </p>
                        </div>

                        {onNewTaskForVehicle && (
                          <button
                            onClick={() => onNewTaskForVehicle(v.placa, selectedClient.nome)}
                            className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Wrench className="w-3.5 h-3.5" /> Abrir Pendência para este Carro
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks / History of this client */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" /> Histórico de Tarefas & Pendências do Cliente ({clientTasks.length})
                </h4>

                {clientTasks.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma tarefa aberta para este cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {clientTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-50"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{t.title}</span>
                          <span className="text-slate-400 ml-2 font-mono">({t.vehiclePlate})</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            t.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Selecione um cliente para ver os detalhes
            </div>
          )}
        </div>
      </div>

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveClient}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={cNome}
                  onChange={(e) => setCNome(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={cTel}
                  onChange={(e) => setCTel(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  value={cDoc}
                  onChange={(e) => setCDoc(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço</label>
                <textarea
                  rows={2}
                  value={cEnd}
                  onChange={(e) => setCEnd(e.target.value)}
                  placeholder="Rua, número, bairro, cidade..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-700/20"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveVehicle}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Placa *</label>
                <input
                  type="text"
                  required
                  value={vPlaca}
                  onChange={(e) => setVPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC-1234 ou BRA-2E19"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={vMarca}
                    onChange={(e) => setVMarca(e.target.value)}
                    placeholder="Ex: Toyota"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={vModelo}
                    onChange={(e) => setVModelo(e.target.value)}
                    placeholder="Ex: Corolla XEi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ano</label>
                  <input
                    type="text"
                    value={vAno}
                    onChange={(e) => setVAno(e.target.value)}
                    placeholder="2022"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cor</label>
                  <input
                    type="text"
                    value={vCor}
                    onChange={(e) => setVCor(e.target.value)}
                    placeholder="Prata"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">KM</label>
                  <input
                    type="text"
                    value={vKm}
                    onChange={(e) => setVKm(e.target.value)}
                    placeholder="54.000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-700/20"
              >
                Salvar Veículo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
