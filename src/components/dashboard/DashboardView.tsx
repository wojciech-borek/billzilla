import { DashboardContainer } from "./DashboardContainer";
import { DashboardPresentation } from "./DashboardPresentation";

interface DashboardViewProps {
  groupsLimit?: number;
  currentUserId: string;
}

/**
 * Main Dashboard view component
 * Uses container/presentation pattern for better separation of concerns
 * Container handles business logic, Presentation handles UI rendering
 */
export default function DashboardView({ groupsLimit = 20, currentUserId }: DashboardViewProps) {
  const presentationProps = DashboardContainer({ groupsLimit, currentUserId });

  return <DashboardPresentation {...presentationProps} />;
}
