import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, select: false },
    image: { type: String },
    
    onboardingCompleted: { type: Boolean, default: false },
    
    info: {
      age: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      gender: { type: String, enum: ['male', 'female'] },
      activity: { type: String, enum: ['sedentary', 'light', 'moderate', 'active'] },
      goal: { type: String, enum: ['lose', 'maintain', 'gain'] },
      targetWeight: { type: Number }, 
      targetDate: { type: Date },
    },

    goals: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    },

    // 👇 NOVO: Registo do que já comeste hoje
    dailyLog: {
      date: { type: Date, default: Date.now }, // Para sabermos de que dia é
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);