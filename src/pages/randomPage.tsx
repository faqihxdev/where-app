import React from 'react';
import { userDataAtom } from '../stores/userStore';
import { useAtomValue } from 'jotai';

const RandomPage: React.FC = () => {
  console.log('[randomPage]: I am in randomPage!');
  const userData = useAtomValue(userDataAtom);
  console.log('[randomPage]: userData', { userData });

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
};

export default RandomPage;
