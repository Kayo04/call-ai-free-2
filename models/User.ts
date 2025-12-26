import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, select: false }, // "select: false" para a password não vir à toa nas pesquisas
    image: { type: String },
    
    // --- DADOS PARA O TEU ONBOARDING ---
    onboardingCompleted: { type: Boolean, default: false }, // Se for false, mostramos o questionário
    
    info: {
      age: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      gender: { type: String, enum: ['male', 'female'] },
      activityLevel: { type: String, enum: ['sedentary', 'active', 'athlete'] },
      goal: { type: String, enum: ['lose', 'maintain', 'gain'] },
    },

    // As metas calculadas pela IA ou pela fórmula matemática
    macros: {
      calories: { type: Number, default: 2000 },
      protein: { type: Number, default: 150 },
      carbs: { type: Number, default: 250 },
      fat: { type: Number, default: 65 },
    },
  },
  { timestamps: true }
);

// Truque para não dar erro de "Model already compiled" no Next.js
export default mongoose.models.User || mongoose.model("User", UserSchema);