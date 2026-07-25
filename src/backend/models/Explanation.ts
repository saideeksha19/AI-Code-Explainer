import { Schema, model, Types } from 'mongoose';

const explanationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guests or persistent auth users
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
    lowercase: true,
  },
  mode: {
    type: String,
    required: true,
    enum: ['explain', 'optimize', 'comments', 'debug', 'convert'],
  },
  targetLanguage: {
    type: String,
    required: false,
  },
  result: {
    explanation: { type: String, required: false },
    timeComplexity: { type: String, required: false },
    spaceComplexity: { type: String, required: false },
    qualityScore: { type: Number, required: false },
    issuesCount: { type: Number, required: false },
    keyConcepts: [{ type: String }],
    
    // New rich explanation fields
    overallExplanation: { type: String, required: false },
    lineByLineExplanation: { type: [Schema.Types.Mixed], required: false },
    bugs: { type: [Schema.Types.Mixed], required: false },
    securityIssues: { type: [Schema.Types.Mixed], required: false },
    improvements: { type: [Schema.Types.Mixed], required: false },
    optimizedVersion: { type: String, required: false },
    dryRun: { type: [Schema.Types.Mixed], required: false },
    interviewQuestions: { type: [Schema.Types.Mixed], required: false },
    bestComplexity: { type: String, required: false },
    averageComplexity: { type: String, required: false },
    worstComplexity: { type: String, required: false },
    complexityExplanation: { type: String, required: false }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Explanation = model('Explanation', explanationSchema);
export default Explanation;
