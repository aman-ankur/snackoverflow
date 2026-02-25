import { DishNutrition, ConfidenceLevel } from '@/lib/dishTypes';
import { motion } from 'framer-motion';

interface DishAlternativesProps {
  primaryDish: DishNutrition;
  alternatives: DishNutrition[];
  selectedIndex: number; // 0 = primary, 1-2 = alternatives
  onSelect: (index: number) => void;
}

export function DishAlternatives({
  primaryDish,
  alternatives,
  selectedIndex,
  onSelect
}: DishAlternativesProps) {
  const allOptions = [primaryDish, ...alternatives];

  const confidenceBadgeColor = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-gray-100 text-gray-700';
    }
  };

  const confidenceLabel = (confidence: ConfidenceLevel) => {
    return confidence === 'high' ? 'Confident' :
           confidence === 'medium' ? 'Likely' : 'Unsure';
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted font-medium">Select Dish</p>
      {allOptions.map((option, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          onClick={() => onSelect(index)}
          className={`
            w-full text-left p-3 rounded-xl border-2 transition-all
            ${selectedIndex === index
              ? 'border-accent bg-accent/5'
              : 'border-border bg-card hover:border-accent/50'
            }
          `}
        >
          <div className="flex items-start gap-3">
            {/* Radio indicator */}
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0
              ${selectedIndex === index ? 'border-accent' : 'border-gray-300'}
            `}>
              {selectedIndex === index && (
                <div className="w-3 h-3 rounded-full bg-accent" />
              )}
            </div>

            {/* Dish info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium">{option.name}</span>
                <span className="text-xs text-muted">· {option.hindi}</span>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${confidenceBadgeColor(option.confidence)}
                `}>
                  {confidenceLabel(option.confidence)}
                </span>
              </div>

              {/* Nutrition preview */}
              <div className="flex items-center gap-3 text-xs text-muted mb-1">
                <span>{option.calories} cal</span>
                <span>P: {option.protein_g}g</span>
                <span>C: {option.carbs_g}g</span>
                <span>F: {option.fat_g}g</span>
              </div>

              {/* Reasoning */}
              <p className="text-xs text-muted mt-1">{option.reasoning}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
