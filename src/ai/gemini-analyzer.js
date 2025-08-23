class GeminiAnalyzer {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || null,
      model: config.model || 'gemini-1.5-flash',
      debug: config.debug || false,
      ...config
    };

    this.gemini = null;
    this.model = null;
    this.isAvailable = false;

    this.loadGemini();
  }

  loadGemini() {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');

      if (!this.config.apiKey) {
        console.warn('Gemini API key not provided. AI analysis will be disabled.');
        return false;
      }

      this.gemini = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.gemini.getGenerativeModel({ model: this.config.model });
      this.isAvailable = true;

      this.log('Gemini AI initialized successfully with model:', this.config.model);
      return true;
    } catch (error) {
      console.error('Failed to load Gemini AI:', error.message);
      this.isAvailable = false;
      return false;
    }
  }

  async listAvailableModels() {
    if (!this.gemini) {
      return { success: false, error: 'Gemini not initialized' };
    }

    try {
      const models = await this.gemini.listModels();
      return { success: true, models: models };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  log(message, data = null) {
    if (this.config.debug) {
      console.log(`[GeminiAnalyzer] ${message}`, data || '');
    }
  }

  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
    return this.loadGemini();
  }

  async analyzeError(errorLog, context = {}) {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'Gemini AI not available. Please check your API key.'
      };
    }

    try {
      this.log('Analyzing error with Gemini AI...');

      const prompt = this.buildErrorAnalysisPrompt(errorLog, context);
      this.log('Generated prompt:', prompt);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      this.log('Received analysis from Gemini');

      return {
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString(),
        model: this.config.model
      };

    } catch (error) {
      console.error('Error analyzing with Gemini:', error);

      let errorMessage = error.message;
      if (error.message.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid API key. Please check your Gemini API key.';
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API quota exceeded. Please check your Gemini API usage.';
      } else if (error.message.includes('SAFETY')) {
        errorMessage = 'Content was blocked by safety filters.';
      } else if (error.message.includes('models/gemini-pro is not found')) {
        errorMessage = 'Model not found. Trying with updated model name...';
        // Try with the new model name
        try {
          this.config.model = 'gemini-1.5-flash';
          this.model = this.gemini.getGenerativeModel({ model: this.config.model });
          this.log('Switched to model:', this.config.model);
          // Retry the analysis
          return await this.analyzeError(errorLog, context);
        } catch (retryError) {
          errorMessage = `Model error: ${retryError.message}. Please check if your API key has access to Gemini models.`;
        }
      } else if (error.message.includes('404')) {
        errorMessage = 'Model not found. Please check if your API key has access to Gemini models.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  buildErrorAnalysisPrompt(errorLog, context) {
    const { 
      language = 'PHP', 
      framework = 'WordPress',
      logType = 'error',
      timestamp = null 
    } = context;

    return `You are an expert ${language} developer specializing in ${framework} debugging. 

Please analyze this ${logType} log and provide a helpful solution:

**Error Log:**
\`\`\`
${errorLog}
\`\`\`

**Context:**
- Language: ${language}
- Framework: ${framework}
- Log Type: ${logType}
${timestamp ? `- Timestamp: ${timestamp}` : ''}

**Please provide:**

1. **🔍 Problem Summary:** Brief explanation of what's wrong
2. **🎯 Root Cause:** What's causing this error
3. **🛠️ Solution Steps:** Step-by-step fix (numbered list)
4. **💡 Prevention:** How to prevent this in the future
5. **📚 Additional Resources:** Relevant documentation links if applicable

**Format your response in clear, actionable sections. Be concise but thorough.**`;
  }

  async suggestFix(errorLog, context = {}) {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'Gemini AI not available'
      };
    }

    try {
      const prompt = `As a ${context.language || 'PHP'} expert, provide a quick fix for this error:

${errorLog}

Respond with:
1. One-line summary
2. Quick fix command or code snippet
3. Why this works

Keep it concise and actionable.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestion = response.text();

      return {
        success: true,
        suggestion: suggestion,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async explainError(errorLog, context = {}) {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'Gemini AI not available'
      };
    }

    try {
      const prompt = `Explain this ${context.language || 'PHP'} error in simple terms:

${errorLog}

Provide:
1. What this error means in plain English
2. Common scenarios when this happens
3. Is it critical or minor?

Keep explanation beginner-friendly.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const explanation = response.text();

      return {
        success: true,
        explanation: explanation,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getStatus() {
    return {
      available: this.isAvailable,
      hasApiKey: !!this.config.apiKey,
      model: this.config.model
    };
  }
}

module.exports = GeminiAnalyzer;
