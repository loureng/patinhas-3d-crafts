import { useEffect } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAuth } from '@/contexts/AuthContext';
import { useLogger } from '@/utils/logger';

interface InteractionTrackerProps {
  productId?: string;
  interactionType: 'view' | 'add_to_cart' | 'purchase' | 'search' | 'wishlist';
  interactionData?: Record<string, unknown>;
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
  const logger = useLogger();

  useEffect(() => {
    if (autoTrack && productId && user) {
      // Log detalhado da interação
      logger.info(`Interaction tracked: ${interactionType}`, {
        type: 'interaction_tracking',
        product_id: productId,
        interaction_type: interactionType,
        interaction_data: interactionData,
        user_id: user.id,
        timestamp: Date.now(),
        url: window.location.href
      });

      // Executar o tracking original
      trackInteraction({
        product_id: productId,
        interaction_type: interactionType,
        interaction_data: interactionData
      }).catch((error) => {
        logger.error('Erro ao rastrear interação', {
          type: 'interaction_tracking_error',
          product_id: productId,
          interaction_type: interactionType,
          error: error.message,
          stack: error.stack
        });
      });
    } else {
      // Log quando não executa tracking
      logger.debug('Interaction tracking skipped', {
        type: 'interaction_tracking_skipped',
        reasons: {
          autoTrack,
          hasProductId: !!productId,
          hasUser: !!user
        },
        product_id: productId,
        interaction_type: interactionType
      });
    }
  }, [autoTrack, productId, interactionType, interactionData, trackInteraction, user, logger]);

  return null; // This component doesn't render anything
};

export default InteractionTracker;