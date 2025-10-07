import { ChangeEvent, useState } from 'react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileLoad: (data: { textos: string[]; labels: number[] }) => void;
  className?: string;
}

export const FileUpload = ({ onFileLoad, className = '' }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    
    // Verificar si es un archivo Excel
    const validExcelExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExcelExtensions.includes(fileExtension)) {
      setError('Por favor, sube un archivo Excel (.xlsx o .xls)');
      return;
    }
    
    setFileName(file.name);
    setError(null);
    
    try {
      // Leer el archivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Obtener la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
        // Verificar si existen las columnas necesarias
      if (jsonData.length > 0) {
        const firstRow = jsonData[0] as any;
        
        // Verificar columnas con diferentes posibles nombres
        const hasTextos = 'textos' in firstRow || 'texto' in firstRow || 'Textos' in firstRow || 'Texto' in firstRow;
        const hasLabels = 'labels' in firstRow || 'label' in firstRow || 'Labels' in firstRow || 'Label' in firstRow || 'ODS' in firstRow || 'ods' in firstRow;
        
        if (!hasTextos || !hasLabels) {
          setError('El archivo Excel debe tener columnas para textos (textos/texto) y etiquetas (labels/ODS)');
          return;
        }        const data = {
          textos: [] as string[],
          labels: [] as number[]
        };
        
        // Procesar cada fila
        jsonData.forEach((row: any) => {
          // Buscar el campo de texto con diferentes posibles nombres
          let texto = null;
          if (row.textos) texto = row.textos;
          else if (row.texto) texto = row.texto;
          else if (row.Textos) texto = row.Textos;
          else if (row.Texto) texto = row.Texto;
          
          // Buscar el campo de etiqueta con diferentes posibles nombres
          let label = NaN;
          if (row.labels !== undefined) label = parseInt(row.labels);
          else if (row.label !== undefined) label = parseInt(row.label);
          else if (row.Labels !== undefined) label = parseInt(row.Labels);
          else if (row.Label !== undefined) label = parseInt(row.Label);
          else if (row.ODS !== undefined) label = parseInt(row.ODS);
          else if (row.ods !== undefined) label = parseInt(row.ods);
          
          if (texto && !isNaN(label)) {
            data.textos.push(texto.toString().trim());
            data.labels.push(label);
          }
        });
        
        if (data.textos.length === 0) {
          setError('No se encontraron datos válidos en el archivo');
          return;
        }
        
        onFileLoad(data);
      } else {
        setError('El archivo Excel está vacío');
      }
    } catch (err) {
      console.error('Error al procesar el archivo:', err);
      setError('Error al procesar el archivo. Asegúrate de que sea un Excel válido.');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-12 h-12 text-green-600 mb-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          
          {fileName ? (
            <p className="text-sm text-gray-700">Archivo seleccionado: <span className="font-semibold">{fileName}</span></p>
          ) : (
            <>
              <p className="mb-1 text-sm text-gray-700">
                <span className="font-semibold">Seleccionar un archivo</span> o arrastrar y soltar
              </p>
              <p className="text-xs text-gray-500">Excel (.xlsx, .xls) hasta 10MB</p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>El archivo Excel debe contener:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Una columna llamada "textos" o "texto" con las opiniones</li>
          <li>Una columna llamada "labels", "label", "ODS" o "ods" con los números de ODS correspondientes</li>
        </ul>
      </div>
    </div>
  );
};