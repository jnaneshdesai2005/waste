import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Parse multipart form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`;

    console.log('Calling Lovable AI for waste classification...');

    // Call Lovable AI with vision model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert waste classification AI. Classify waste items into exactly one of these 5 categories: Plastic, Paper, Organic, Metal, or Glass. Respond ONLY with a JSON object in this exact format: {"category": "CategoryName", "confidence": 0.95, "reasoning": "brief explanation"}. Be confident and decisive.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Classify this waste item into one of these categories: Plastic, Paper, Organic, Metal, or Glass. Provide your confidence level (0-1) and brief reasoning.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    console.log('AI Response:', aiResponse);

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response from AI
    let result;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: try to extract category from text
      const categories = ['Plastic', 'Paper', 'Organic', 'Metal', 'Glass'];
      const foundCategory = categories.find(cat => 
        aiResponse.toLowerCase().includes(cat.toLowerCase())
      );
      
      result = {
        category: foundCategory || 'Plastic',
        confidence: 0.75,
        reasoning: aiResponse.substring(0, 200)
      };
    }

    // Normalize category name
    const validCategories = ['Plastic', 'Paper', 'Organic', 'Metal', 'Glass'];
    const normalizedCategory = validCategories.find(cat => 
      cat.toLowerCase() === result.category?.toLowerCase()
    ) || result.category;

    return new Response(
      JSON.stringify({
        category: normalizedCategory,
        confidence: Math.min(Math.max(result.confidence || 0.8, 0), 1),
        reasoning: result.reasoning || 'Classification based on visual analysis'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in classify-waste function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to classify waste. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
