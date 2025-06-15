
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState("");
  const [notes, setNotes] = useState("");
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const moods = [
    { emoji: "😭", label: "Very Sad", value: "very-sad", score: 1 },
    { emoji: "😢", label: "Sad", value: "sad", score: 2 },
    { emoji: "😐", label: "Neutral", value: "neutral", score: 3 },
    { emoji: "😊", label: "Happy", value: "happy", score: 4 },
    { emoji: "😄", label: "Very Happy", value: "very-happy", score: 5 },
  ];

  const loadMoodHistory = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (user?.user) {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: true })
        .limit(30);

      if (data && !error) {
        const chartData = data.map((entry) => {
          const mood = moods.find(m => m.value === entry.mood);
          return {
            date: new Date(entry.created_at!).toLocaleDateString(),
            mood: mood?.score || 3,
            label: mood?.label || "Unknown",
          };
        });
        setMoodHistory(chartData);
      }
    }
  };

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const handleSubmitMood = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling today.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { error } = await supabase
          .from("mood_entries")
          .insert({
            user_id: user.user.id,
            mood: selectedMood,
            notes: notes || null,
          });

        if (error) throw error;

        toast({
          title: "Mood logged!",
          description: "Your mood has been recorded successfully.",
        });

        // Reset form
        setSelectedMood("");
        setNotes("");
        
        // Reload history
        loadMoodHistory();
      }
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

  const getTodaysMood = () => {
    const today = new Date().toLocaleDateString();
    return moodHistory.find(entry => entry.date === today);
  };

  const getAverageMood = () => {
    if (moodHistory.length === 0) return 0;
    const sum = moodHistory.reduce((acc, entry) => acc + entry.mood, 0);
    return (sum / moodHistory.length).toFixed(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        😊 Mood Tracker
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Mood Input */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How are you feeling today?
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((mood) => (
                <motion.button
                  key={mood.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-4 rounded-2xl text-center transition-all duration-300 ${
                    selectedMood === mood.value
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105 shadow-lg"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="text-2xl mb-2">{mood.emoji}</div>
                  <div className="text-xs font-medium">{mood.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's on your mind today?"
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleSubmitMood}
            disabled={loading || !selectedMood}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Log Mood
          </Button>

          {getTodaysMood() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-sm text-green-800">
                ✅ You've already logged your mood today: {getTodaysMood()?.label}
              </p>
            </motion.div>
          )}
        </div>

        {/* Mood Analytics */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Your Mood Trend</h3>
            </div>

            {moodHistory.length > 0 ? (
              <>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis domain={[1, 5]} fontSize={12} />
                      <Tooltip
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(value: any, name) => [
                          moods.find(m => m.score === value)?.label || "Unknown",
                          "Mood"
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getAverageMood()}
                    </div>
                    <div className="text-sm text-blue-800">Average Mood</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {moodHistory.length}
                    </div>
                    <div className="text-sm text-purple-800">Days Tracked</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Start tracking your mood to see trends!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
