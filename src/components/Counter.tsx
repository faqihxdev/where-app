import { useAtom } from 'jotai';
import { counterAtom } from '../stores/counterAtom';
import { Button, Text } from '@chakra-ui/react';

function Counter() {
  const [count, setCount] = useAtom(counterAtom);

  return (
    <div>
      <Text fontSize="2xl">{count}</Text>
      <Button onClick={() => setCount(count + 1)} colorScheme="teal">
        Increment
      </Button>
    </div>
  );
}

export default Counter;
