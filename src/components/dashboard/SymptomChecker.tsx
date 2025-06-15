
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const { toast } = useToast();

  // Simulated AI response based on symptoms
  const analyzeSymptoms = async (symptomText: string) => {
    // This is a simplified AI simulation
    const lowerSymptoms = symptomText.toLowerCase();
    
    let urgencyLevel = "mild";
    let causes = [];
    let suggestions = [];

    if (lowerSymptoms.includes("chest pain") || lowerSymptoms.includes("difficulty breathing") || lowerSymptoms.includes("severe headache")) {
      urgencyLevel = "critical";
      causes = ["Possible cardiac event", "Respiratory distress", "Severe hypertension"];
      suggestions = ["Seek immediate emergency medical attention", "Call 911 or go to nearest ER", "Do not drive yourself"];
    } else if (lowerSymptoms.includes("fever") || lowerSymptoms.includes("persistent cough") || lowerSymptoms.includes("severe pain")) {
      urgencyLevel = "moderate";
      causes = ["Viral infection", "Bacterial infection", "Inflammatory condition"];
      suggestions = ["Schedule appointment with healthcare provider", "Monitor symptoms closely", "Rest and stay hydrated"];
    } else {
      urgencyLevel = "mild";
      causes = ["Minor viral illness", "Stress-related symptoms", "Lifestyle factors"];
      suggestions = ["Rest and self-care", "Stay hydrated", "Monitor for changes", "Consider OTC remedies"];
    }

    return {
      urgency_level: urgencyLevel,
      analysis: {
        possible_causes: causes,
        suggestions: suggestions,
        disclaimer: "This is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice."
      }
    };
  };

  const handleSubmit = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    try {
      const analysis = await analyzeSymptoms(symptoms);
      
      // Store in database
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { error } = await supabase
          .from("symptom_checks")
          .insert({
            user_id: user.user.id,
            symptoms,
            ai_response: JSON.stringify(analysis.analysis),
            urgency_level: analysis.urgency_level,
          });

        if (error) throw error;
      }

      setResponse(analysis);
      toast({
        title: "Analysis Complete",
        description: "Your symptoms have been analyzed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSymptoms(prev => prev + ' ' + transcript);
      };
      recognition.onerror = () => {
        toast({
          title: "Voice recognition error",
          description: "Please try again or type your symptoms.",
          variant: "destructive",
        });
        setListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Voice recognition not supported",
        description: "Please type your symptoms.",
        variant: "destructive",
      });
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "moderate": return "text-orange-600 bg-orange-50 border-orange-200";
      case "mild": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertTriangle className="h-5 w-5" />;
      case "moderate": return <AlertCircle className="h-5 w-5" />;
      case "mild": return <CheckCircle className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        🩺 AI Symptom Checker
      </h2>

      <div className="space-y-6">
        {/* Input Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your symptoms
          </label>
          <div className="relative">
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please describe your symptoms in detail..."
              className="min-h-[100px] pr-12"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={startListening}
              disabled={listening}
              className={`absolute bottom-2 right-2 ${listening ? 'text-red-600' : 'text-gray-500'}`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          {listening && (
            <p className="text-sm text-red-600 mt-2 animate-pulse">
              Listening... Speak now
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !symptoms.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Analyze Symptoms
        </Button>

        {/* Response Section */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Urgency Level */}
            <div className={`p-4 rounded-lg border ${getUrgencyColor(response.urgency_level)}`}>
              <div className="flex items-center mb-2">
                {getUrgencyIcon(response.urgency_level)}
                <span className="ml-2 font-semibold capitalize">
                  {response.urgency_level} Priority
                </span>
              </div>
            </div>

            {/* Possible Causes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Possible Causes:</h4>
              <ul className="list-disc list-inside space-y-1">
                {response.analysis.possible_causes.map((cause: string, index: number) => (
                  <li key={index} className="text-gray-700">{cause}</li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1">
                {response.analysis.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-gray-700">{suggestion}</li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> {response.analysis.disclaimer}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;
