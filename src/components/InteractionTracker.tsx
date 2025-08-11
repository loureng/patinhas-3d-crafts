import { useEffect } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAuth } from '@/contexts/AuthContext';

interface InteractionTrackerProps {
  productId?: string;
  interactionType: 'view' | 'add_to_cart' | 'purchase' | 'search' | 'wishlist';
  interactionData?: any;
  autoTrack?: boolean;
}

const InteractionTracker: React.FC<InteractionTrackerProps> = ({
  productId,
  interactionType,
  interactionData = {},
  autoTrack = true
}) => {
  const { trackInteraction } = useRecommendations();
  const { user } = useAuth();

  useEffect(() => {
    if (autoTrack && productId && user) {
      trackInteraction({
        product_id: productId,
        interaction_type: interactionType,
        interaction_data: interactionData
      });
    }
  }, [autoTrack, productId, interactionType, interactionData, trackInteraction, user]);

  return null; // This component doesn't render anything
};

export default InteractionTracker;