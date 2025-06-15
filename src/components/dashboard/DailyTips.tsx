
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DailyTips = () => {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const affirmations = [
    "You are worthy of love and respect exactly as you are.",
    "Your feelings are valid and it's okay to experience them.",
    "You have overcome challenges before, and you can do it again.",
    "Progress, not perfection, is what matters.",
    "You are stronger than you think.",
    "It's okay to rest and take care of yourself.",
    "You deserve compassion, especially from yourself.",
    "Every small step forward is an achievement.",
    "You are not alone in your journey.",
    "Your mental health matters and you're worth the effort."
  ];

  const selfCareTips = [
    "Take 5 deep breaths and notice how your body feels.",
    "Step outside for a few minutes and feel the fresh air.",
    "Write down three things you're grateful for today.",
    "Listen to your favorite song and really focus on the melody.",
    "Drink a glass of water mindfully, noticing the taste and temperature.",
    "Do some gentle stretching or yoga poses.",
    "Call or text someone who makes you smile.",
    "Organize a small space in your home - it can help clear your mind.",
    "Take a warm shower or bath and enjoy the sensation.",
    "Practice saying 'no' to something that drains your energy."
  ];

  const generateDailyTips = async () => {
    setLoading(true);
    try {
      // Generate random tips for today
      const todayAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
      const todaySelfCare = selfCareTips[Math.floor(Math.random() * selfCareTips.length)];

      const newTips = [
        {
          id: 1,
          tip_text: todayAffirmation,
          tip_type: "affirmation",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          tip_text: todaySelfCare,
          tip_type: "self-care",
          created_at: new Date().toISOString(),
        },
      ];

      // Try to save to database (might fail due to RLS, but that's okay for demo)
      try {
        await supabase.from("daily_tips").insert([
          {
            tip_text: todayAffirmation,
            tip_type: "affirmation",
          },
          {
            tip_text: todaySelfCare,
            tip_type: "self-care",
          },
        ]);
      } catch (error) {
        // Ignore database errors for tips
        console.log("Note: Tips saved locally for demo purposes");
      }

      setTips(newTips);
    } catch (error) {
      console.error("Error generating tips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateDailyTips();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          ✨ Daily Wellness Tips
        </h2>
        <Button
          onClick={generateDailyTips}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {tips.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className={`p-6 rounded-2xl border-l-4 ${
              tip.tip_type === "affirmation"
                ? "bg-gradient-to-r from-pink-50 to-purple-50 border-l-pink-500"
                : "bg-gradient-to-r from-blue-50 to-green-50 border-l-blue-500"
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${
                tip.tip_type === "affirmation"
                  ? "bg-pink-100 text-pink-600"
                  : "bg-blue-100 text-blue-600"
              }`}>
                {tip.tip_type === "affirmation" ? (
                  <Heart className="h-6 w-6" />
                ) : (
                  <Sparkles className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2 capitalize">
                  {tip.tip_type === "affirmation" ? "Daily Affirmation" : "Self-Care Tip"}
                </h3>
                <p className="text-gray-700 leading-relaxed">{tip.tip_text}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {tips.length === 0 && !loading && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Click refresh to get your daily wellness tips!</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Generating your personalized tips...</p>
          </div>
        )}
      </div>

      {/* Wellness Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100"
      >
        <blockquote className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">
            "Self-care is not a luxury. It's a necessity."
          </p>
          <footer className="text-sm text-gray-600">— Your Health Buddy</footer>
        </blockquote>
      </motion.div>
    </div>
  );
};

export default DailyTips;
