import { Box, Text, CloseButton } from "@chakra-ui/react";
import { createStandaloneToast } from "@chakra-ui/react";

type ToastColor = 'primary' | 'success' | 'danger' | 'warning';

interface CustomToastProps {
  title: string;
  description?: string;
  color: ToastColor;
}

const { toast } = createStandaloneToast();

const colorMap: Record<ToastColor, string> = {
  primary: 'bg-blue-600',
  success: 'bg-green-600',
  danger: 'bg-red-600',
  warning: 'bg-yellow-600',
};

export const showCustomToast = ({ title, description, color }: CustomToastProps) => {
  const bgColor = colorMap[color];

  toast({
    position: "top",
    duration: 5000,
    isClosable: true,
    render: ({ onClose }) => (
      <Box
        className={`${bgColor} p-4 flex justify-between items-center`}
        borderRadius="md"
        boxShadow="lg"
      >
        <Box>
          <Text fontWeight="bold" color="white">
            {title}
          </Text>
          {description && <Text color="white">{description}</Text>}
        </Box>
        <CloseButton color="white" onClick={onClose} />
      </Box>
    ),
  });
};
