import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Send,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Car,
  User,
  Camera,
  Image as ImageIcon,
  Share2,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Budget } from '../types';

export const BudgetsManager: React.FC = () => {
  const { budgets, clients, vehicles, config, updateBudgetStatus, deleteBudget } = useTasks();
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; title: string } | null>(null);

  // Estado para modal de compartilhamento (WhatsApp / Apps)
  const [shareModalData, setShareModalData] = useState<{
    budget: Budget;
    fileName: string;
    text: string;
    clientTel: string;
    file?: File;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [customTel, setCustomTel] = useState('');

  const filteredBudgets = budgets.filter((b) => {
    if (statusFilter === 'todos') return true;
    return b.status === statusFilter;
  });

  // Constrói o documento PDF com cabeçalho, logo, tabela de itens e fotos anexadas
  const buildPdfDoc = (budget: Budget) => {
    const client = clients.find((c) => c.id === budget.clienteId);
    const vehicle = vehicles.find((v) => v.id === budget.veiculoId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Faixa Superior
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 36, 'F');

    // Logo da Oficina no PDF
    let textStartX = 14;
    if (config.logo) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(12, 5, 26, 26, 2, 2, 'F');
        doc.addImage(config.logo, 13, 6, 24, 24);
        textStartX = 44;
      } catch (err) {
        console.warn('Erro ao inserir logo no PDF:', err);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(config.nome, textStartX, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`CNPJ: ${config.cnpj} • Telefone: ${config.tel}`, textStartX, 22);
    doc.text(config.end, textStartX, 28);

    // Título e Metadados do Orçamento
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORÇAMENTO OFICIAL #${budget.numero}`, 14, 48);

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.8);
    doc.line(14, 51, pageWidth - 14, 51);

    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');

    const validadeDate = new Date(budget.data);
    validadeDate.setDate(validadeDate.getDate() + (config.validade || 15));

    let y = 60;
    const clientCol = 14;
    const vehicleCol = pageWidth / 2 + 5;

    doc.text(`Cliente: ${client?.nome || 'Consumidor'}`, clientCol, y);
    doc.text(`Veículo: ${vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Não informado'}`, vehicleCol, y);
    y += 6;

    doc.text(`CPF/CNPJ: ${client?.doc || 'Não informado'}`, clientCol, y);
    doc.text(`Placa: ${vehicle?.placa || '-'} • Ano/Cor: ${vehicle?.ano || '-'}/${vehicle?.cor || '-'}`, vehicleCol, y);
    y += 6;

    doc.text(`Telefone: ${client?.tel || '-'}`, clientCol, y);
    doc.text(
      `Data: ${new Date(budget.data).toLocaleDateString('pt-BR')} • Validade: ${validadeDate.toLocaleDateString('pt-BR')}`,
      vehicleCol,
      y
    );
    y += 10;

    // Tabela de itens/serviços
    const tableRows = budget.itens.map((it) => [
      it.peca,
      it.foto ? `${it.servico} [Com Foto Anexa]` : it.servico,
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

    // Bloco de Totais
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

    // Condições de Pagamento
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('Formas de Pagamento:', 14, finalY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const splitPayment = doc.splitTextToSize(config.pagto, pageWidth - 28);
    doc.text(splitPayment, 14, finalY + 34);

    // Linha de Assinatura
    const sigY = finalY + 54;
    if (sigY < 250) {
      doc.setDrawColor(150);
      doc.line(35, sigY, pageWidth - 35, sigY);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Assinatura do Cliente / Aprovação do Orçamento', pageWidth / 2, sigY + 5, { align: 'center' });
    }

    // REGISTRO FOTOGRÁFICO NO PDF (Fotos dos serviços e avarias)
    const photosList =
      budget.fotos && budget.fotos.length > 0
        ? budget.fotos
        : budget.itens
            .filter((i) => i.foto)
            .map((i) => ({ peca: i.peca, servico: i.servico, foto: i.foto! }));

    if (photosList.length > 0) {
      doc.addPage();
      let photoY = 20;

      // Cabeçalho da página de fotos com logo
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, pageWidth, 24, 'F');
      if (config.logo) {
        try {
          doc.addImage(config.logo, 12, 3, 18, 18);
        } catch {}
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`REGISTRO FOTOGRÁFICO - ORÇAMENTO #${budget.numero}`, config.logo ? 36 : 14, 15);

      photoY = 35;
      const colWidth = (pageWidth - 28 - 10) / 2;
      const imgHeight = 55;

      for (let i = 0; i < photosList.length; i++) {
        const item = photosList[i];
        const col = i % 2;

        if (col === 0 && i > 0) {
          photoY += imgHeight + 22;
          if (photoY + imgHeight + 22 > 280) {
            doc.addPage();
            photoY = 25;
          }
        }

        const posX = 14 + col * (colWidth + 10);

        try {
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(posX, photoY, colWidth, imgHeight + 14, 3, 3, 'FD');
          doc.addImage(item.foto, posX + 2, photoY + 2, colWidth - 4, imgHeight);

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 58, 95);
          const caption = `${item.peca} - ${item.servico || ''}`;
          const splitCaption = doc.splitTextToSize(caption, colWidth - 6);
          doc.text(splitCaption[0] || caption, posX + 3, photoY + imgHeight + 8);
        } catch (imgErr) {
          console.warn('Erro ao inserir foto no PDF:', imgErr);
        }
      }
    }

    const fileName = `orcamento-${budget.numero}-${vehicle?.placa || 'oficina'}.pdf`;
    return { doc, fileName, client, vehicle };
  };

  // Baixa o arquivo PDF localmente
  const baixarPdf = (budget: Budget) => {
    const { doc, fileName } = buildPdfDoc(budget);
    doc.save(fileName);
  };

  // Prepara o texto e arquivo para compartilhamento no WhatsApp e múltiplos aplicativos
  const handleSharePdf = async (budget: Budget) => {
    const { doc, fileName, client, vehicle } = buildPdfDoc(budget);
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const clientName = client?.nome || 'Cliente';
    const vehicleInfo = vehicle ? `${vehicle.marca} ${vehicle.modelo} (Placa ${vehicle.placa})` : '';

    const shareTitle = `Orçamento #${budget.numero} - ${config.nome}`;
    const shareText =
      `*${config.nome}*\n` +
      `📋 *Orçamento Oficial #${budget.numero}*\n\n` +
      `Olá, *${clientName}*!\n` +
      (vehicleInfo ? `Referente ao veículo: *${vehicleInfo}*\n` : '') +
      `Total dos serviços e peças: *R$ ${budget.total.toFixed(2).replace('.', ',')}*\n` +
      `Validade: ${config.validade || 15} dias\n\n` +
      `📄 O PDF detalhado com valores e fotos dos serviços foi gerado para você.\n` +
      `Ficamos à disposição para esclarecer qualquer dúvida ou aprovação!\n` +
      `Contato: ${config.tel}`;

    const clientPhone = client?.tel || '';
    setCustomTel(clientPhone);

    // Tenta primeiro o Web Share API com suporte a arquivos (abre WhatsApp, Telegram, Gmail, etc. nativamente no mobile)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: shareTitle,
          text: shareText,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Usuário fechou a janela nativa de compartilhamento
          return;
        }
        console.warn('Compartilhamento nativo de arquivo não concluído, abrindo opções:', err);
      }
    }

    // Se o navegador não suportar envio direto de arquivo (ex.: desktop Chrome/Firefox)
    // baixa o PDF para o usuário já ter o arquivo e abre o menu de envio para WhatsApp e outros apps
    doc.save(fileName);
    setShareModalData({
      budget,
      fileName,
      text: shareText,
      clientTel: clientPhone,
      file: pdfFile,
    });
  };

  const handleOpenWhatsApp = (phone: string, text: string) => {
    // Limpa caracteres especiais mantendo apenas números
    const cleanNumber = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(text);

    let url = '';
    if (cleanNumber) {
      // Se não tiver DDD nacional (ex: 55), adiciona 55 se tiver 10 ou 11 dígitos
      const finalNumber =
        cleanNumber.length === 10 || cleanNumber.length === 11 ? `55${cleanNumber}` : cleanNumber;
      url = `https://api.whatsapp.com/send?phone=${finalNumber}&text=${encoded}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encoded}`;
    }

    window.open(url, '_blank');
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleNativeShareOnlyText = async (title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          handleCopyText(text);
        }
      }
    } else {
      handleCopyText(text);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {config.logo ? (
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
              <img src={config.logo} alt={config.nome} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          )}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Financeiro & Propostas</span>
            <h2 className="text-xl font-bold text-slate-900">Histórico de Orçamentos da Oficina</h2>
            <p className="text-xs text-slate-500">Orçamentos completos com fotos dos serviços e exportação em PDF</p>
          </div>
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
            const itemsWithPhotos = b.itens.filter((i) => i.foto);

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
                    <div className="flex items-center gap-1.5">
                      {itemsWithPhotos.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> {itemsWithPhotos.length} foto(s)
                        </span>
                      )}
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
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{client?.nome || 'Cliente não identificado'}</h3>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mb-2">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    {vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})` : 'Veículo não informado'}
                  </p>

                  {/* Photo thumbnails strip if attached */}
                  {itemsWithPhotos.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 overflow-x-auto py-1">
                      {itemsWithPhotos.slice(0, 4).map((it, idx) => (
                        <img
                          key={idx}
                          src={it.foto}
                          alt={it.servico}
                          onClick={() => setPreviewPhoto({ src: it.foto!, title: `${it.peca} - ${it.servico}` })}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 cursor-pointer hover:border-blue-500 transition-all shrink-0"
                          title={`${it.peca}: ${it.servico}`}
                        />
                      ))}
                      {itemsWithPhotos.length > 4 && (
                        <span className="text-[10px] font-bold text-slate-400">+{itemsWithPhotos.length - 4}</span>
                      )}
                    </div>
                  )}

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
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => baixarPdf(b)}
                      className="py-2 px-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm transition-all"
                      title="Baixar PDF no dispositivo"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharePdf(b)}
                      className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm transition-all"
                      title="Compartilhar no WhatsApp e outros aplicativos"
                    >
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Compartilhar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBudget(b)}
                      className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      title="Ver detalhes do orçamento"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Detalhes</span>
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                {config.logo && (
                  <img src={config.logo} alt="Logo" className="w-9 h-9 object-contain rounded-lg border p-0.5" />
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">Orçamento #{selectedBudget.numero}</h3>
                  <p className="text-xs text-slate-500">{config.nome}</p>
                </div>
              </div>
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

            <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-2 text-left">Foto</th>
                  <th className="p-2 text-left">Peça</th>
                  <th className="p-2 text-left">Serviço</th>
                  <th className="p-2 text-center">Qtd</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedBudget.itens.map((it, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2 w-12">
                      {it.foto ? (
                        <img
                          src={it.foto}
                          alt={it.servico}
                          onClick={() => setPreviewPhoto({ src: it.foto!, title: `${it.peca} - ${it.servico}` })}
                          className="w-9 h-9 rounded object-cover cursor-pointer border border-slate-200 hover:border-blue-500 shadow-xs"
                          title="Clique para ampliar"
                        />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-2 font-medium text-slate-800">{it.peca}</td>
                    <td className="p-2 text-slate-600">{it.servico}</td>
                    <td className="p-2 text-center">{it.qtd}</td>
                    <td className="p-2 text-right font-semibold">R$ {(it.qtd * it.valor).toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Photos Gallery */}
            {selectedBudget.itens.some((i) => i.foto) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" /> Registro Fotográfico das Avarias:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedBudget.itens
                    .filter((i) => i.foto)
                    .map((it, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewPhoto({ src: it.foto!, title: `${it.peca} - ${it.servico}` })}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all shadow-xs"
                      >
                        <img src={it.foto} alt={it.servico} className="w-full h-24 object-cover rounded-md" />
                        <span className="block text-[10px] font-bold text-slate-700 mt-1 truncate">
                          {it.peca}
                        </span>
                        <span className="block text-[9px] text-slate-400 truncate">{it.servico}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

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

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBudget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => handleSharePdf(selectedBudget)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" /> Compartilhar PDF (WhatsApp)
              </button>
              <button
                type="button"
                onClick={() => baixarPdf(selectedBudget)}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-700/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal (WhatsApp & Multi-app) */}
      {shareModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShareModalData(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Compartilhar Orçamento</h3>
                  <p className="text-xs text-slate-500">Orçamento #{shareModalData.budget.numero}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalData(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Notification / Info banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">O PDF já foi baixado no seu dispositivo!</p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Ao abrir o WhatsApp ou outro app, anexe o arquivo <span className="font-mono font-bold text-emerald-800">{shareModalData.fileName}</span> que acabou de ser salvo na sua pasta de Downloads.
                </p>
              </div>
            </div>

            {/* WhatsApp Direct Option */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                WhatsApp do Cliente
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="(DDD) 99999-9999"
                  value={customTel}
                  onChange={(e) => setCustomTel(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(customTel, shareModalData.text)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Abrir WhatsApp
                </button>
              </div>
            </div>

            {/* Multi-app or System Share button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  handleNativeShareOnlyText(
                    `Orçamento #${shareModalData.budget.numero} - ${config.nome}`,
                    shareModalData.text
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                Enviar para outros Aplicativos (Telegram, E-mail, Drive, etc.)
              </button>

              <button
                type="button"
                onClick={() => handleCopyText(shareModalData.text)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Mensagem Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar Texto do Orçamento</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => baixarPdf(shareModalData.budget)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Novamente o Arquivo PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">{previewPhoto.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[70vh]">
              <img src={previewPhoto.src} alt={previewPhoto.title} className="w-full h-full object-contain" />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
