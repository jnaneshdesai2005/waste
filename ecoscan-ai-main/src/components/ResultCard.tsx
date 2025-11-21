import { Card } from '@/components/ui/card';
import { CheckCircle2, Recycle, FileText, Leaf, Wrench, Wine, Sparkles } from 'lucide-react';

interface ResultCardProps {
  result: {
    category: string;
    confidence: number;
    reasoning: string;
  };
}

const categoryConfig = {
  Plastic: {
    icon: Recycle,
    color: 'waste-plastic',
    bgColor: 'bg-waste-plastic/10',
    borderColor: 'border-waste-plastic',
  },
  Paper: {
    icon: FileText,
    color: 'waste-paper',
    bgColor: 'bg-waste-paper/10',
    borderColor: 'border-waste-paper',
  },
  Organic: {
    icon: Leaf,
    color: 'waste-organic',
    bgColor: 'bg-waste-organic/10',
    borderColor: 'border-waste-organic',
  },
  Metal: {
    icon: Wrench,
    color: 'waste-metal',
    bgColor: 'bg-waste-metal/10',
    borderColor: 'border-waste-metal',
  },
  Glass: {
    icon: Wine,
    color: 'waste-glass',
    bgColor: 'bg-waste-glass/10',
    borderColor: 'border-waste-glass',
  },
};

const ResultCard = ({ result }: ResultCardProps) => {
  const config = categoryConfig[result.category as keyof typeof categoryConfig] || categoryConfig.Plastic;
  const Icon = config.icon;
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <Card className={`p-6 md:p-8 border-2 ${config.borderColor} shadow-card animate-scale-in bg-gradient-to-br from-card to-card/50`}>
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Icon */}
        <div className={`p-5 ${config.bgColor} rounded-2xl shadow-soft mx-auto md:mx-0`}>
          <Icon className={`w-12 h-12 md:w-14 md:h-14 text-${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 w-full">
          <div className="text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-3">
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {result.category}
              </h3>
              <CheckCircle2 className="w-8 h-8 text-primary animate-scale-in flex-shrink-0" />
            </div>
            <p className="text-muted-foreground leading-relaxed">{result.reasoning}</p>
          </div>

          {/* Confidence Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">AI Confidence Score</span>
              <span className="text-lg font-bold text-primary">{confidencePercent}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${confidencePercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {confidencePercent >= 90 ? '🎯 Very High' : confidencePercent >= 75 ? '✅ High' : '⚠️ Moderate'} Confidence
            </p>
          </div>

          {/* Disposal Tips */}
          <div className={`p-5 ${config.bgColor} rounded-xl border border-${config.color}/20 shadow-soft`}>
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Recycle className={`w-5 h-5 text-${config.color}`} />
              Recycling Tips
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {getDisposalTip(result.category)}
            </p>
          </div>

          {/* Environmental Impact */}
          <div className="flex items-center justify-center gap-2 p-4 bg-primary/5 rounded-lg">
            <Leaf className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-primary">
              Great job! Proper sorting helps protect our environment 🌍
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

const getDisposalTip = (category: string): string => {
  const tips: Record<string, string> = {
    Plastic: 'Rinse clean and place in the plastic recycling bin. Check for recycling symbols.',
    Paper: 'Keep dry and place in paper recycling. Remove any plastic or metal attachments.',
    Organic: 'Perfect for composting! Helps create nutrient-rich soil for gardens.',
    Metal: 'Rinse cans and place in metal recycling. Can be recycled indefinitely!',
    Glass: 'Rinse and recycle. Glass can be recycled endlessly without quality loss.',
  };
  return tips[category] || 'Please dispose responsibly according to local guidelines.';
};

export default ResultCard;
