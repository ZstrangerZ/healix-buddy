
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms } = await req.json();

    if (!symptoms) {
      throw new Error('Symptoms are required');
    }

    const groqApiKey = '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';
    
    console.log('Sending request to Groq API for symptom analysis...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a medical AI assistant for symptom analysis. Analyze the given symptoms and provide a structured response in JSON format with the following structure:
            {
              "urgency_level": "critical|moderate|mild",
              "possible_causes": ["cause1", "cause2", "cause3"],
              "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
              "disclaimer": "This is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice."
            }

            Guidelines for urgency levels:
            - Critical: Chest pain, difficulty breathing, severe headache, signs of stroke, severe bleeding, high fever with confusion
            - Moderate: Persistent fever, severe pain, persistent cough, unusual fatigue, concerning changes
            - Mild: Minor aches, slight fever, common cold symptoms, minor cuts

            Be specific and relevant to the symptoms provided. Provide actionable suggestions.`
          },
          {
            role: 'user',
            content: `Analyze these symptoms: ${symptoms}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    console.log('Groq API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error response:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Groq API response data:', JSON.stringify(data));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from Groq API:', data);
      throw new Error('Invalid response from Groq API');
    }

    const analysisText = data.choices[0].message.content;
    
    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', analysisText);
      // Fallback response if JSON parsing fails
      analysis = {
        urgency_level: "moderate",
        possible_causes: ["Various conditions possible", "Further evaluation needed"],
        suggestions: ["Consult healthcare provider", "Monitor symptoms", "Seek medical attention if worsening"],
        disclaimer: "This is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice."
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in groq-symptom-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      urgency_level: "moderate",
      possible_causes: ["Analysis temporarily unavailable"],
      suggestions: ["Please try again or consult healthcare provider directly"],
      disclaimer: "This is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
