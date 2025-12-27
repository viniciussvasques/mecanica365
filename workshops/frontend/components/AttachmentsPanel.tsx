'use client';

import { useState, useRef } from 'react';
import { attachmentsApi, Attachment, AttachmentType, CreateAttachmentDto } from '@/lib/api/attachments';
import { getAxiosErrorMessage } from '@/lib/utils/error.utils';
import { logger } from '@/lib/utils/logger';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface AttachmentsPanelProps {
  entityType: 'quote' | 'service_order';
  entityId: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  readonly?: boolean;
}

export function AttachmentsPanel({
  entityType,
  entityId,
  attachments: initialAttachments = [],
  onAttachmentsChange,
  readonly = false,
}: AttachmentsPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType, setSelectedType] = useState<AttachmentType>(AttachmentType.PHOTO_BEFORE);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    try {
      setUploading(true);

      const createDto: CreateAttachmentDto = {
        type: selectedType,
        description: description.trim() || undefined,
        ...(entityType === 'quote' ? { quoteId: entityId } : { serviceOrderId: entityId }),
      };

      const newAttachment = await attachmentsApi.upload(selectedFile, createDto);
      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      onAttachmentsChange?.(updatedAttachments);

      // Reset form
      setDescription('');
      setSelectedType(AttachmentType.PHOTO_BEFORE);
      setSelectedFile(null);
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      logger.error('[AttachmentsPanel] Erro ao fazer upload:', error);
      const errorMessage = getAxiosErrorMessage(error) || 'Erro ao fazer upload do arquivo. Tente novamente.';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return;

    try {
      await attachmentsApi.remove(id);
      const updatedAttachments = attachments.filter((att) => att.id !== id);
      setAttachments(updatedAttachments);
      onAttachmentsChange?.(updatedAttachments);
    } catch (error: unknown) {
      logger.error('[AttachmentsPanel] Erro ao remover anexo:', error);
      const errorMessage = getAxiosErrorMessage(error) || 'Erro ao remover anexo. Tente novamente.';
      alert(errorMessage);
    }
  };

  const getTypeLabel = (type: AttachmentType): string => {
    const labels: Record<AttachmentType, string> = {
      [AttachmentType.PHOTO_BEFORE]: 'Foto Antes',
      [AttachmentType.PHOTO_DURING]: 'Foto Durante',
      [AttachmentType.PHOTO_AFTER]: 'Foto Depois',
      [AttachmentType.DOCUMENT]: 'Documento',
      [AttachmentType.OTHER]: 'Outro',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAttachmentUrl = (url: string): string => {
    // Se a URL já é absoluta, retornar como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Se estiver no navegador, usar o subdomain e porta corretos
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.localhost');

      if (isLocalhost) {
        // Usar porta 3001 para o backend (onde os arquivos estáticos são servidos)
        return `http://${hostname}:3001${url}`;
      }

      // Para produção, usar a base da API sem /api
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const apiBase = baseUrl.replace(/\/api\/?$/, '');
      return `${apiBase}${url}`;
    }

    // Fallback para SSR
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiBase = baseUrl.replace(/\/api\/?$/, '');
    return `${apiBase}${url}`;
  };

  return (
    <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#D0D6DE]">Anexos</h3>
        {!readonly && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadModal(true)}
          >
            + Adicionar Anexo
          </Button>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-[#7E8691] text-sm">Nenhum anexo adicionado</p>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-[#1A1D24] border border-[#2A3038] rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                {attachment.mimeType && attachment.mimeType.startsWith('image/') ? (
                  <img
                    src={getAttachmentUrl(attachment.url)}
                    alt={attachment.originalName || 'Anexo'}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      // Se a imagem falhar ao carregar, mostrar ícone de documento
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-16 h-16 bg-[#2A3038] rounded flex items-center justify-center fallback-icon';
                        fallback.innerHTML = '<span class="text-2xl">📄</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#2A3038] rounded flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#D0D6DE] font-medium truncate">
                    {attachment.originalName}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-1 bg-[#2A3038] text-[#7E8691] text-xs rounded">
                      {getTypeLabel(attachment.type)}
                    </span>
                    <span className="text-[#7E8691] text-xs">
                      {formatFileSize(attachment.fileSize)}
                    </span>
                  </div>
                  {attachment.description && (
                    <p className="text-[#7E8691] text-xs mt-1">{attachment.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={getAttachmentUrl(attachment.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00E0B8] hover:text-[#00C9A7] text-sm"
                >
                  Ver
                </a>
                {!readonly && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setDescription('');
          setSelectedType(AttachmentType.PHOTO_BEFORE);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        title="Adicionar Anexo"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Tipo de Anexo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AttachmentType)}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            >
              <option value={AttachmentType.PHOTO_BEFORE}>Foto Antes</option>
              <option value={AttachmentType.PHOTO_DURING}>Foto Durante</option>
              <option value={AttachmentType.PHOTO_AFTER}>Foto Depois</option>
              <option value={AttachmentType.DOCUMENT}>Documento</option>
              <option value={AttachmentType.OTHER}>Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o anexo..."
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Arquivo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            />
            {selectedFile && (
              <p className="text-sm text-[#7E8691] mt-2">
                Arquivo selecionado: <span className="text-[#D0D6DE]">{selectedFile.name}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                setDescription('');
                setSelectedType(AttachmentType.PHOTO_BEFORE);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

