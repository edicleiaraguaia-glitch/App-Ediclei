import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, CheckCircle, XCircle, Send, Trash2, Eye, Calendar, DollarSign, Car, User } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Budget } from '../types';

export const BudgetsManager: React.FC = () => {
  const { budgets, clients, vehicles, config, updateBudgetStatus, deleteBudget } = useTasks();
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const filteredBudgets = budgets.filter((b) => {
    if (statusFilter === 'todos') return true;
    return b.status === statusFilter;
  });

  const generatePdf = (budget: Budget) => {
    const client = clients.find((c) => c.id === budget.clienteId);
    const vehicle = vehicles.find((v) => v.id === budget.veiculoId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(config.nome, 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`CNPJ: ${config.cnpj} • Telefone: ${config.tel}`, 14, 22);
    doc.text(config.end, 14, 27);

    // Title & Metadata
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORÇAMENTO OFICIAL #${budget.numero}`, 14, 45);

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.8);
    doc.line(14, 48, pageWidth - 14, 48);

    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');

    const validadeDate = new Date(budget.data);
    validadeDate.setDate(validadeDate.getDate() + (config.validade || 15));

    let y = 56;
    const clientCol = 14;
    const vehicleCol = pageWidth / 2 + 5;

    doc.text(`Cliente: ${client?.nome || 'Consumidor'}`, clientCol, y);
    doc.text(`Veículo: ${vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Não informado'}`, vehicleCol, y);
    y += 6;

    doc.text(`CPF/CNPJ: ${client?.doc || 'Não informado'}`, clientCol, y);
    doc.text(`Placa: ${vehicle?.placa || '-'} • Ano/Cor: ${vehicle?.ano || '-'}/${vehicle?.cor || '-'}`, vehicleCol, y);
    y += 6;

    doc.text(`Telefone: ${client?.tel || '-'}`, clientCol, y);
    doc.text(`Data: ${new Date(budget.data).toLocaleDateString('pt-BR')} • Validade: ${validadeDate.toLocaleDateString('pt-BR')}`, vehicleCol, y);
    y += 10;

    // Table of services
    const tableRows = budget.itens.map((it) => [
      it.peca,
      it.servico,
      it.qtd.toString(),
      `R$ ${it.valor.toFixed(2).replace('.', ',')}`,
      `R$ ${(it.qtd * it.valor).toFixed(2).replace('.', ',')}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Peça / Componente', 'Serviço Executado', 'Qtd', 'V. Unit.', 'Total']],
      body: tableRows.length > 0 ? tableRows : [['-', 'Sem serviços cadastrados', '0', 'R$ 0,00', 'R$ 0,00']],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals Box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`Subtotal: R$ ${budget.subtotal.toFixed(2).replace('.', ',')}`, pageWidth - 80, finalY);
    doc.text(`Desconto: - R$ ${budget.desconto.toFixed(2).replace('.', ',')}`, pageWidth - 80, finalY + 6);

    doc.setDrawColor(30, 58, 95);
    doc.line(pageWidth - 80, finalY + 9, pageWidth - 14, finalY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 95);
    doc.text(`TOTAL: R$ ${budget.total.toFixed(2).replace('.', ',')}`, pageWidth - 80, finalY + 16);

    // Payment conditions
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('Formas de Pagamento:', 14, finalY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const splitPayment = doc.splitTextToSize(config.pagto, pageWidth - 28);
    doc.text(splitPayment, 14, finalY + 34);

    // Signature Line
    const sigY = finalY + 54;
    if (sigY < 270) {
      doc.setDrawColor(150);
      doc.line(35, sigY, pageWidth - 35, sigY);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Assinatura do Cliente / Aprovação do Orçamento', pageWidth / 2, sigY + 5, { align: 'center' });
    }

    doc.save(`orcamento-${budget.numero}-${vehicle?.placa || 'oficina'}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Financeiro & Propostas</span>
          <h2 className="text-xl font-bold text-slate-900">Histórico de Orçamentos da Oficina</h2>
          <p className="text-xs text-slate-500">Gere orçamentos e exporte relatórios em PDF com 1 clique</p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'rascunho', label: 'Rascunho' },
            { id: 'enviado', label: 'Enviado' },
            { id: 'aprovado', label: 'Aprovado' },
            { id: 'recusado', label: 'Recusado' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === f.id
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBudgets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Nenhum orçamento encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Crie um orçamento no Checklist da Carroceria para começar.</p>
          </div>
        ) : (
          filteredBudgets.map((b) => {
            const client = clients.find((c) => c.id === b.clienteId);
            const vehicle = vehicles.find((v) => v.id === b.veiculoId);

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      #{b.numero}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        b.status === 'aprovado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'enviado'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'recusado'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{client?.nome || 'Cliente não identificado'}</h3>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mb-2">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    {vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})` : 'Veículo não informado'}
                  </p>

                  <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 mb-4">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span>R$ {b.subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {b.desconto > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Desconto:</span>
                        <span>- R$ {b.desconto.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                      <span>Total:</span>
                      <span className="text-blue-700">R$ {b.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => generatePdf(b)}
                      className="py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar PDF
                    </button>
                    <button
                      onClick={() => setSelectedBudget(b)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detalhes
                    </button>
                  </div>

                  {/* Status switches */}
                  <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
                    <button
                      onClick={() => updateBudgetStatus(b.id, 'enviado')}
                      className="flex-1 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-medium text-center"
                    >
                      Enviar
                    </button>
                    <button
                      onClick={() => updateBudgetStatus(b.id, 'aprovado')}
                      className="flex-1 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-medium text-center"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => updateBudgetStatus(b.id, 'recusado')}
                      className="flex-1 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-medium text-center"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => deleteBudget(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Orçamento #{selectedBudget.numero}</h3>
              <button onClick={() => setSelectedBudget(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <strong>Data de emissão:</strong> {new Date(selectedBudget.data).toLocaleString('pt-BR')}
              </p>
              <p>
                <strong>Status:</strong> {selectedBudget.status}
              </p>
            </div>

            <table className="w-full text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-2 text-left">Peça</th>
                  <th className="p-2 text-left">Serviço</th>
                  <th className="p-2 text-center">Qtd</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedBudget.itens.map((it, i) => (
                  <tr key={i}>
                    <td className="p-2">{it.peca}</td>
                    <td className="p-2">{it.servico}</td>
                    <td className="p-2 text-center">{it.qtd}</td>
                    <td className="p-2 text-right">R$ {(it.qtd * it.valor).toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {selectedBudget.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Desconto:</span>
                <span>- R$ {selectedBudget.desconto.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t">
                <span>TOTAL:</span>
                <span className="text-blue-700">R$ {selectedBudget.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBudget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                onClick={() => generatePdf(selectedBudget)}
                className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
