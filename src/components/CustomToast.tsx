import { Box, Text, CloseButton } from "@chakra-ui/react";
import { createStandaloneToast } from "@chakra-ui/react"; // Import standalone toast

interface CustomToastProps {
  title: string;
  description?: string;
  bgColor?: string; // Optional Tailwind class for background color
}

// Create the standalone toast instance
const { toast } = createStandaloneToast();

export const showCustomToast = ({ title, description, bgColor = "bg-blue-500" }: CustomToastProps) => {
  toast({
    // Position center top
    position: "top",
    duration: 5000, // Timer in ms
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
