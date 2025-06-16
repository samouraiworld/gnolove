import ContributorModal from '@/components/features/contributor/contributor-modal';
import { FC } from 'react';

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ContributorModal>
      { children }
    </ContributorModal>
  );
};

export default Layout;