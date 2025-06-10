// API Training Configuration
const API_TRAINING_CONFIG = {
  model: 'gpt-4.1-mini',
  epochs: 3,
  batchSize: 4
};

// Training data for prescriptive analytics
const TRAINING_DATA = [
  {
    "prompt": "Given maintenance data showing high frequency of AC repairs in rooms 301, 302, and 303, what are the recommended actions?",
    "completion": "Based on the maintenance patterns, I recommend:\n1. IMMEDIATE: Replace AC units in rooms 301-303 (3+ repairs each)\n2. PREVENTIVE: Schedule quarterly AC maintenance for all units\n3. COST ANALYSIS: Estimated savings of $1,200 per unit by replacing vs. continued repairs\n4. TIMELINE: Complete replacements within 2 weeks to prevent further issues"
  },
  {
    "prompt": "Analyze tenant growth data showing 15% increase in occupancy over 3 months. What actions should be taken?",
    "completion": "Based on the growth trend:\n1. CAPACITY: Increase cleaning staff by 2 members\n2. MAINTENANCE: Implement preventive maintenance schedule\n3. RESOURCES: Stock up on common maintenance supplies\n4. STAFFING: Consider hiring additional maintenance personnel"
  },
  {
    "prompt": "Room 405 has had 4 plumbing issues in 2 months. What is the recommended course of action?",
    "completion": "For Room 405 plumbing issues:\n1. URGENT: Complete pipe inspection and replacement\n2. COST: Estimated $800 for full replacement vs. $400 in repair costs\n3. TIMELINE: Schedule within 48 hours\n4. PREVENTION: Install water pressure regulator"
  },
  {
    "prompt": "Electrical issues reported in 5 rooms on floor 3. What are the recommended steps?",
    "completion": "For floor 3 electrical issues:\n1. SAFETY: Conduct immediate electrical safety audit\n2. REPAIRS: Prioritize rooms with multiple issues\n3. UPGRADE: Consider upgrading electrical panel\n4. SCHEDULE: Implement monthly electrical inspections"
  },
  {
    "prompt": "High cleaning requests in rooms 501-505. What actions should be taken?",
    "completion": "For cleaning issues in rooms 501-505:\n1. STAFFING: Increase cleaning frequency to daily\n2. SUPPLIES: Provide additional cleaning supplies\n3. TRAINING: Conduct cleaning staff training\n4. MONITORING: Implement cleaning quality checks"
  }
];

// Function to validate training data
const validateTrainingData = (data) => {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Training data must be an array');
    }
    if (data.length === 0) {
      throw new Error('Training data cannot be empty');
    }
    data.forEach(item => {
      if (!item.prompt || !item.completion) {
        throw new Error('Each training item must have prompt and completion fields');
      }
    });
    return true;
  } catch (error) {
    throw new Error(`Invalid training data format: ${error.message}`);
  }
};

// Function to start API training
const startApiTraining = async () => {
  try {
    // Validate training data
    validateTrainingData(TRAINING_DATA);

    // Get API key from environment
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a file upload request
    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        purpose: 'fine-tune',
        file: btoa(JSON.stringify(TRAINING_DATA))
      })
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    const fileData = await response.json();

    // Start fine-tuning
    const fineTuneResponse = await fetch('https://api.openai.com/v1/fine-tunes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        training_file: fileData.id,
        model: API_TRAINING_CONFIG.model,
        n_epochs: API_TRAINING_CONFIG.epochs,
        batch_size: API_TRAINING_CONFIG.batchSize
      })
    });

    if (!fineTuneResponse.ok) {
      throw new Error(`Fine-tuning failed: ${fineTuneResponse.statusText}`);
    }

    const fineTuneData = await fineTuneResponse.json();
    return {
      success: true,
      fileId: fileData.id,
      fineTuneId: fineTuneData.id
    };
  } catch (error) {
    console.error('API Training Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export {
  startApiTraining,
  API_TRAINING_CONFIG,
  TRAINING_DATA
}; 