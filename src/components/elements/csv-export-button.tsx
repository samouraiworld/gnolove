'use client';

import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { ComponentProps } from 'react';
import { toast } from 'sonner';

interface CSVExportButtonProps<T = any> extends ComponentProps<typeof Button> {
  data: T[];
  filename?: string;
}

const CSVExportButton = ({ data, filename = 'data', ...props }: CSVExportButtonProps) => {
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
      toast.error('Failed to export CSV');
    }
  };

  return (
    <Button
      onClick={handleCSVExport}
      size="sm"
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
