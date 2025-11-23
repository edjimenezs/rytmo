'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from './DashboardNav';
import Link from 'next/link';
import { DocumentType } from '@prisma/client';

const documentTypeLabels: Record<DocumentType, string> = {
  LAB_RESULT: 'Resultados de Laboratorio',
  IMAGING: 'Imágenes Médicas',
  PRESCRIPTION: 'Recetas',
  MEDICAL_REPORT: 'Informes Médicos',
  OTHER: 'Otros',
};

const labResultCategories = [
  'Hemograma Completo',
  'Bioquímica General',
  'Proteínas',
  'Perfil Lipídico',
  'Función Hepática',
  'Función Renal',
  'Hormonas',
  'Vitamina D',
  'Ferritina',
  'Otro',
];

export default function UploadMedicalDocument({ user }: { user: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LAB_RESULT' as DocumentType,
    testDate: '',
    category: '',
    file: null as File | null,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      setFormData({ ...formData, file });
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    if (!formData.title.trim()) {
      setError('Por favor ingresa un título');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('type', formData.type);
      
      // Combine category and description
      let description = formData.description.trim();
      if (formData.category && formData.type === 'LAB_RESULT') {
        description = formData.category + (description ? ` - ${description}` : '');
      }
      if (description) {
        uploadFormData.append('description', description);
      }
      
      if (formData.testDate) {
        uploadFormData.append('testDate', formData.testDate);
      }

      const response = await fetch('/api/medical/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al subir el documento');
        return;
      }

      // If it's a lab result, process it automatically
      if (formData.type === 'LAB_RESULT' && data.document) {
        try {
          const processResponse = await fetch('/api/medical/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documentId: data.document.id }),
          });

          const processData = await processResponse.json();
          if (processResponse.ok && processData.labValuesCount > 0) {
            // Success with lab values extracted
            router.push(`/dashboard/medical?uploaded=true&processed=true&values=${processData.labValuesCount}`);
            return;
          }
        } catch (processError) {
          console.error('Error processing document:', processError);
          // Continue anyway, document was uploaded successfully
        }
      }

      // Success - redirect to medical data page
      router.push('/dashboard/medical?uploaded=true');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Error al subir el documento. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} userRole="ATHLETE" />
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard/medical"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Volver a Medical Data
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Subir Documento Médico
            </h1>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as DocumentType })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                >
                  {(Object.keys(documentTypeLabels) as DocumentType[]).map((type) => (
                    <option key={type} value={type}>
                      {documentTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category (for Lab Results) */}
              {formData.type === 'LAB_RESULT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría del Examen
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Selecciona una categoría</option>
                    {labResultCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Ejemplos: Hemograma, Bioquímicos, Proteínas, etc.
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ej: Hemograma Completo - Enero 2025"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>

              {/* Test Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Examen/Estudio
                </label>
                <input
                  type="date"
                  value={formData.testDate}
                  onChange={(e) =>
                    setFormData({ ...formData, testDate: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción / Notas
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Información adicional sobre el documento..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo * (PDF, imágenes, Word - máximo 10MB)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                {formData.file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Archivo seleccionado: {formData.file.name} (
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Subiendo...' : 'Subir Documento'}
                </button>
                <Link
                  href="/dashboard/medical"
                  className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </Link>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Tipos de documentos que puedes subir:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                <strong>Resultados de Laboratorio:</strong> Hemograma, bioquímicos, proteínas,
                perfil lipídico, función hepática/renal, hormonas, etc.
              </li>
              <li>
                <strong>Imágenes Médicas:</strong> Rayos X, resonancias, ecografías, etc.
              </li>
              <li>
                <strong>Recetas:</strong> Prescripciones médicas
              </li>
              <li>
                <strong>Informes Médicos:</strong> Reportes de consultas, diagnósticos, etc.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

