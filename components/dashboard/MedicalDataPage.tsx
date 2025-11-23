'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import DashboardNav from './DashboardNav';
import Link from 'next/link';
import { DocumentType } from '@prisma/client';
import MedicalAgentPanel from './MedicalAgentPanel';
import LabResultsComparison from './LabResultsComparison';

interface MedicalDocument {
  id: string;
  title: string;
  description: string | null;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  testDate: Date | null;
  uploadedAt: Date;
  processed?: boolean;
}

const documentTypeLabels: Record<DocumentType, string> = {
  LAB_RESULT: 'Resultados de Laboratorio',
  IMAGING: 'Imágenes Médicas',
  PRESCRIPTION: 'Recetas',
  MEDICAL_REPORT: 'Informes Médicos',
  OTHER: 'Otros',
};

const documentTypeIcons: Record<DocumentType, string> = {
  LAB_RESULT: '🧪',
  IMAGING: '📷',
  PRESCRIPTION: '💊',
  MEDICAL_REPORT: '📄',
  OTHER: '📋',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function MedicalDataPage({ user }: { user: any }) {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [groupedDocuments, setGroupedDocuments] = useState<Record<string, MedicalDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DocumentType | 'ALL'>('ALL');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== 'ALL') {
          params.append('type', filter);
        }

        const response = await fetch(`/api/medical?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
          setGroupedDocuments(data.groupedByType || {});
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching medical documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [filter]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/medical?id=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh documents
        const params = new URLSearchParams();
        if (filter !== 'ALL') {
          params.append('type', filter);
        }
        const fetchResponse = await fetch(`/api/medical?${params.toString()}`);
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          setDocuments(data.documents || []);
          setGroupedDocuments(data.groupedByType || {});
          setTotal(data.total || 0);
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const filteredDocuments = filter === 'ALL' ? documents : documents.filter(doc => doc.type === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} userRole="ATHLETE" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical Data</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona tus documentos médicos, resultados de exámenes e imágenes
              </p>
            </div>
            <Link
              href="/dashboard/medical/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Subir Documento
            </Link>
          </div>

          {/* Medical Agent Panel */}
          <div className="mb-6">
            <MedicalAgentPanel />
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({total})
              </button>
              {(Object.keys(documentTypeLabels) as DocumentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {documentTypeIcons[type]} {documentTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Lab comparisons */}
          {(filter === 'ALL' || filter === 'LAB_RESULT') && (
            <div className="mb-6">
              <LabResultsComparison />
            </div>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🏥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay documentos médicos
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'ALL'
                  ? "Aún no has subido ningún documento médico."
                  : `No hay documentos de tipo "${documentTypeLabels[filter as DocumentType]}".`}
              </p>
              <Link
                href="/dashboard/medical/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Subir Tu Primer Documento
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {(Object.keys(groupedDocuments) as DocumentType[]).map((type) => {
                const typeDocs = groupedDocuments[type] || [];
                if (filter !== 'ALL' && filter !== type) return null;
                if (typeDocs.length === 0) return null;

                return (
                  <div key={type} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        <span className="text-2xl mr-2">{documentTypeIcons[type]}</span>
                        {documentTypeLabels[type]} ({typeDocs.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {typeDocs.map((doc) => (
                        <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {doc.title}
                                </h3>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                {doc.testDate && (
                                  <div>
                                    <span className="font-medium">Fecha del examen:</span>{' '}
                                    {format(new Date(doc.testDate), 'dd/MM/yyyy')}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Subido:</span>{' '}
                                  {format(new Date(doc.uploadedAt), 'dd/MM/yyyy')}
                                </div>
                                <div>
                                  <span className="font-medium">Tamaño:</span> {formatFileSize(doc.fileSize)}
                                </div>
                                <div>
                                  <span className="font-medium">Tipo:</span> {doc.mimeType}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {doc.type === 'LAB_RESULT' && !doc.processed && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await fetch('/api/medical/process', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ documentId: doc.id }),
                                      });
                                      const data = await response.json();
                                      if (response.ok) {
                                        // Refresh documents
                                        const params = new URLSearchParams();
                                        if (filter !== 'ALL') {
                                          params.append('type', filter);
                                        }
                                        const fetchResponse = await fetch(`/api/medical?${params.toString()}`);
                                        if (fetchResponse.ok) {
                                          const docData = await fetchResponse.json();
                                          setDocuments(docData.documents || []);
                                          setGroupedDocuments(docData.groupedByType || {});
                                          setTotal(docData.total || 0);
                                        }
                                        // Show success message
                                        if (data.labValuesCount > 0) {
                                          alert(`Documento analizado: ${data.labValuesCount} valores encontrados`);
                                        } else {
                                          alert('No se encontraron valores. Revisa la consola del servidor para ver el texto extraído.');
                                        }
                                      } else {
                                        alert(`Error: ${data.error || 'No se pudo procesar el documento'}`);
                                      }
                                    } catch (error) {
                                      console.error('Error processing document:', error);
                                      alert('Error al procesar el documento');
                                    }
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                >
                                  🔍 Analizar
                                </button>
                              )}
                              {doc.type === 'LAB_RESULT' && doc.processed && (
                                <button
                                  onClick={async () => {
                                    if (!confirm('¿Re-analizar este documento? Los valores anteriores se eliminarán.')) {
                                      return;
                                    }
                                    try {
                                      const response = await fetch('/api/medical/process', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ documentId: doc.id }),
                                      });
                                      if (response.ok) {
                                        // Refresh documents and analysis
                                        const params = new URLSearchParams();
                                        if (filter !== 'ALL') {
                                          params.append('type', filter);
                                        }
                                        const fetchResponse = await fetch(`/api/medical?${params.toString()}`);
                                        if (fetchResponse.ok) {
                                          const data = await fetchResponse.json();
                                          setDocuments(data.documents || []);
                                          setGroupedDocuments(data.groupedByType || {});
                                          setTotal(data.total || 0);
                                          // Reload page to refresh analysis
                                          window.location.reload();
                                        }
                                      } else {
                                        const errorData = await response.json();
                                        alert(`Error: ${errorData.error || 'No se pudo re-analizar el documento'}`);
                                      }
                                    } catch (error) {
                                      console.error('Error re-processing document:', error);
                                      alert('Error al re-analizar el documento');
                                    }
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                  title="Re-analizar documento"
                                >
                                  🔄 Re-analizar
                                </button>
                              )}
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Ver
                              </a>
                              <a
                                href={doc.fileUrl}
                                download
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Descargar
                              </a>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
