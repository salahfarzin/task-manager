import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '../store/taskStore';

interface FileUploadProps {
  taskId: string;
  onClose: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ taskId, onClose }) => {
  const { t } = useTranslation();
  const { addAttachment } = useTaskStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        // In a real app, you'd upload to a server/cloud storage
        // For demo, we'll create a local object URL
        const url = URL.createObjectURL(file);
        
        addAttachment(taskId, {
          name: file.name,
          url,
          size: file.size,
          type: file.type,
        });
      });
      onClose();
    },
    [taskId, addAttachment, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('task.addAttachment')}
        </p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-600'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-700 dark:text-slate-400" />
        {isDragActive ? (
          <p className="text-sm text-primary-600 dark:text-primary-400">
            Drop files here...
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-slate-700 dark:text-slate-400">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-500">
              Any file type supported
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
