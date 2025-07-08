'use client';

import Papa from 'papaparse';
import { Button, ButtonProps } from '@radix-ui/themes';

interface CSVExportButtonProps extends ButtonProps {
  data: any;
  filename?: string;
}

const CSVExportButton = ({ data, filename = 'data', ...props }: CSVExportButtonProps) => {
  const handleCSVExport = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleCSVExport} size="1" variant="ghost" {...props}>
      {props.children}
    </Button>
  );
};

export default CSVExportButton;
