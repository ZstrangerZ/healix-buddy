
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
    
    console.log('Analyzing symptoms:', symptoms);
    
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
            content: `You are a medical AI assistant for symptom analysis. You MUST respond with ONLY a valid JSON object in this exact format:
            {
              "urgency_level": "critical|moderate|mild",
              "possible_causes": ["cause1", "cause2", "cause3"],
              "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
              "disclaimer": "This is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice."
            }

            Guidelines for urgency levels:
            - Critical: Chest pain, difficulty breathing, severe headache, signs of stroke, severe bleeding, high fever with confusion, severe allergic reactions
            - Moderate: Persistent fever, severe pain, persistent cough, unusual fatigue, concerning changes, moderate injuries
            - Mild: Minor aches, slight fever, common cold symptoms, minor cuts, mild headaches

            Be specific and relevant to the symptoms provided. Provide actionable suggestions. 
            IMPORTANT: Respond with ONLY the JSON object, no additional text or explanations.`
          },
          {
            role: 'user',
            content: `Analyze these symptoms and respond with only the JSON object: ${symptoms}`
          }
        ],
        temperature: 0.1,
        max_tokens: 300,
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

    let analysisText = data.choices[0].message.content.trim();
    console.log('Raw analysis text:', analysisText);
    
    // Extract JSON from the response text
    let analysis;
    try {
      // Try to find JSON in the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisText = jsonMatch[0];
      }
      
      analysis = JSON.parse(analysisText);
      console.log('Successfully parsed analysis:', analysis);
      
      // Validate the response structure
      if (!analysis.urgency_level || !analysis.possible_causes || !analysis.suggestions) {
        throw new Error('Invalid analysis structure');
      }
      
    } catch (parseError) {
      console.error('Failed to parse JSON response:', analysisText, parseError);
      
      // Create a more specific fallback based on common symptoms
      const symptomsLower = symptoms.toLowerCase();
      let urgencyLevel = "mild";
      let causes = ["Common condition", "Requires evaluation"];
      let suggestions = ["Monitor symptoms", "Rest and hydration", "Consult healthcare provider if symptoms persist"];
      
      // Basic symptom analysis for fallback
      if (symptomsLower.includes("chest pain") || symptomsLower.includes("difficulty breathing") || 
          symptomsLower.includes("severe headache") || symptomsLower.includes("confusion")) {
        urgencyLevel = "critical";
        causes = ["Potentially serious condition", "Requires immediate attention"];
        suggestions = ["Seek immediate medical attention", "Call emergency services if severe", "Do not delay treatment"];
      } else if (symptomsLower.includes("fever") || symptomsLower.includes("persistent pain") || 
                 symptomsLower.includes("severe") || symptomsLower.includes("unusual")) {
        urgencyLevel = "moderate";
        causes = ["Possible infection or inflammation", "May require medical evaluation"];
        suggestions = ["Consult healthcare provider within 24-48 hours", "Monitor temperature and symptoms", "Seek care if worsening"];
      }
      
      analysis = {
        urgency_level: urgencyLevel,
        possible_causes: causes,
        suggestions: suggestions,
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
      possible_causes: ["Analysis temporarily unavailable", "Technical issue occurred"],
      suggestions: ["Please try again in a moment", "Consult healthcare provider directly if urgent", "Contact medical professional for evaluation"],
      disclaimer: "This is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
