'use client';

import Papa from 'papaparse';
import { Button, ButtonProps } from '@radix-ui/themes';
import { useToast } from '@/contexts/toast-context';

interface CSVExportButtonProps<T = any> extends ButtonProps {
  data: T[];
  filename?: string;
}

const CSVExportButton = ({ data, filename = 'data', ...props }: CSVExportButtonProps) => {
  const { addToast } = useToast();
  const handleCSVExport = () => {
    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      addToast({
        title: 'Error',
        message: 'Failed to export CSV',
        mode: 'negative',
      });
    }
  };

  return (
    <Button
      onClick={handleCSVExport}
      size="1"
      variant="ghost"
      title={`Export ${filename} as CSV`}
      aria-label={`Export ${filename} as CSV`}
      {...props}
    >
      {props.children}
    </Button>
  );
};

export default CSVExportButton;
