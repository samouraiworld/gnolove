import { FC } from 'react';

import ContributorModal from '@/components/features/contributor/contributor-modal';

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ContributorModal>{children}</ContributorModal>;
};

export default Layout;
