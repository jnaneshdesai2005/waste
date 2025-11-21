import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Loader2, Sparkles, Recycle, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ResultCard from './ResultCard';

interface ClassificationResult {
  category: string;
  confidence: number;
  reasoning: string;
}

const WasteClassifier = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const classifyImage = useCallback(async (file: File) => {
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data, error } = await supabase.functions.invoke('classify-waste', {
        body: formData,
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
      toast.success('🎉 Image classified successfully!', {
        description: `Detected: ${data.category} (${Math.round(data.confidence * 100)}% confidence)`,
      });
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Failed to classify image', {
        description: 'Please try again or use a different image.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file', {
        description: 'Supported formats: JPG, PNG, WEBP',
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large', {
        description: 'Please select an image smaller than 10MB',
      });
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-classify after preview
    await classifyImage(file);
  }, [classifyImage]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleReset = useCallback(() => {
    setImage(null);
    setResult(null);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-12 md:pt-16 pb-8 md:pb-12">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Recycle className="w-10 h-10 md:w-12 md:h-12 text-primary animate-pulse" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Recycle className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              EcoVision AI
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            🌍 Intelligent waste classification powered by AI. Upload or capture an image to instantly identify waste category and get recycling tips.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            <span className="px-3 py-1 bg-primary/10 rounded-full">🔄 Plastic</span>
            <span className="px-3 py-1 bg-primary/10 rounded-full">📄 Paper</span>
            <span className="px-3 py-1 bg-primary/10 rounded-full">🌿 Organic</span>
            <span className="px-3 py-1 bg-primary/10 rounded-full">🔧 Metal</span>
            <span className="px-3 py-1 bg-primary/10 rounded-full">🍾 Glass</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          {!image && !isLoading && (
            <Card
              className={`p-8 md:p-12 border-2 border-dashed transition-all duration-300 hover:shadow-soft ${
                isDragging 
                  ? 'border-primary bg-primary/5 shadow-glow scale-[1.02]' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className={`p-6 bg-primary/10 rounded-full transition-all duration-300 ${
                    isDragging ? 'scale-110 bg-primary/20' : ''
                  }`}>
                    {isDragging ? (
                      <ImageIcon className="w-12 h-12 text-primary animate-bounce" />
                    ) : (
                      <Upload className="w-12 h-12 text-primary" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-semibold mb-2">
                    {isDragging ? 'Drop your image here' : 'Upload Waste Image'}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Drag and drop, choose a file, or take a photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported: JPG, PNG, WEBP • Max size: 10MB
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Choose File
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 hover:scale-105 transition-all duration-300"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>
                </div>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>✨ Powered by advanced AI vision technology</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            </Card>
          )}

          {/* Image Preview & Results */}
          {(image || isLoading) && (
            <div className="space-y-6 animate-scale-in">
              {image && (
                <Card className="overflow-hidden shadow-card relative group">
                  <img
                    src={image}
                    alt="Waste item for classification"
                    className="w-full h-auto max-h-[32rem] object-contain bg-gradient-to-br from-muted/50 to-muted"
                  />
                  {!isLoading && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={handleReset}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </Card>
              )}

              {isLoading && (
                <Card className="p-12 text-center space-y-6 border-primary/20">
                  <div className="flex justify-center">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-primary animate-spin" />
                      <Sparkles className="w-6 h-6 text-primary-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold flex items-center justify-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      Analyzing Image
                    </h3>
                    <p className="text-muted-foreground text-lg">
                      Our AI is identifying the waste category...
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </Card>
              )}

              {result && !isLoading && <ResultCard result={result} />}

              {!isLoading && result && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    onClick={handleReset}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Classify Another Image
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Info Cards */}
          {!image && !isLoading && (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-12 animate-fade-in">
              {[
                { 
                  title: 'Fast Analysis', 
                  desc: 'Results in seconds with AI', 
                  icon: '⚡',
                  color: 'from-yellow-500/20 to-orange-500/20'
                },
                { 
                  title: 'High Accuracy', 
                  desc: '5 waste categories detected', 
                  icon: '🎯',
                  color: 'from-green-500/20 to-emerald-500/20'
                },
                { 
                  title: 'Easy to Use', 
                  desc: 'Upload, capture, or drag', 
                  icon: '📱',
                  color: 'from-blue-500/20 to-cyan-500/20'
                },
              ].map((item, idx) => (
                <Card
                  key={idx}
                  className="p-6 text-center hover:shadow-card transition-all duration-300 hover:-translate-y-2 cursor-pointer group border-border/50 hover:border-primary/50"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Footer Info */}
          {!image && !isLoading && (
            <div className="mt-16 text-center space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <p className="text-muted-foreground">
                Help the environment by properly sorting your waste 🌱
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  AI-Powered
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Real-time Analysis
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Eco-Friendly
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WasteClassifier;
