export interface IToast {
  id?: number;
  open?: boolean;
  title: string;
  message: string;
  timer?: number;
  infinite?: boolean;
  mode?: 'info' | 'positive' | 'negative';
}
