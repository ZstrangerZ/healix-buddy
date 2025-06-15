
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SymptomChecker from "@/components/dashboard/SymptomChecker";
import MentalHealthChat from "@/components/dashboard/MentalHealthChat";
import DailyTips from "@/components/dashboard/DailyTips";
import MoodTracker from "@/components/dashboard/MoodTracker";

const Dashboard = () => {
  const [activePanel, setActivePanel] = useState("symptoms");
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    }
  };

  const panels = [
    { id: "symptoms", label: "Symptom Checker", icon: "🩺" },
    { id: "chat", label: "Mental Health Chat", icon: "🧠" },
    { id: "tips", label: "Daily Tips", icon: "✨" },
    { id: "mood", label: "Mood Tracker", icon: "😊" },
  ];

  const renderActivePanel = () => {
    switch (activePanel) {
      case "symptoms":
        return <SymptomChecker />;
      case "chat":
        return <MentalHealthChat />;
      case "tips":
        return <DailyTips />;
      case "mood":
        return <MoodTracker />;
      default:
        return <SymptomChecker />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Health Buddy
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700">
                <User className="h-4 w-4 mr-2" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {panels.map((panel) => (
              <motion.button
                key={panel.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActivePanel(panel.id)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  activePanel === panel.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="text-2xl mb-2">{panel.icon}</div>
                <div className="font-medium text-sm">{panel.label}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Active Panel */}
        <motion.div
          key={activePanel}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderActivePanel()}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
