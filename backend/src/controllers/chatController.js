const { GoogleGenAI } = require('@google/genai');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

exports.handleChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, history } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not set in the environment variables.' });
    }

    // Initialize Gemini SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Fetch user's financial data for context
    const incomes = await Income.findAll({ where: { userId }, raw: true });
    const expenses = await Expense.findAll({ where: { userId }, raw: true });
    const budgets = await Budget.findAll({ where: { userId }, raw: true });

    // Format context
    const contextPrompt = `
You are a helpful and intelligent financial assistant for a personal finance app called BirrWise.
The user is asking you questions about their financial data.
Here is the user's current financial data context:

--- INCOMES ---
${incomes.length ? incomes.map(i => `- ${i.date}: ${i.amount} ETB (${i.source}) - ${i.description || 'No description'}`).join('\n') : 'No incomes recorded.'}

--- EXPENSES ---
${expenses.length ? expenses.map(e => `- ${e.date}: ${e.amount} ETB (${e.category}) - ${e.description || 'No description'}`).join('\n') : 'No expenses recorded.'}

--- BUDGETS ---
${budgets.length ? budgets.map(b => `- ${b.name}: ${b.amount} ETB (Spent: ${b.spentAmount || 0} ETB)`).join('\n') : 'No budgets recorded.'}

Based on this data and the conversation history, answer the user's latest query accurately and concisely. Do not invent financial data that is not in this context. If they ask about something not in their data, politely inform them that you can only answer questions based on the recorded financial data in their app.
`;

    // Construct the messages array for the Gemini API
    const formattedHistory = (history || []).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: contextPrompt,
      }
    });

    res.json({ reply: response.text });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ message: 'Failed to generate response. Please try again later.' });
  }
};
