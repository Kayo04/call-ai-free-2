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
      gender: { type: String },
      activity: { type: String },
      goal: { type: String },
      targetWeight: { type: Number }, 
      targetDate: { type: Date },
    },

    goals: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
      cholesterol: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      iron: { type: Number, default: 0 },
      vitC: { type: Number, default: 0 },
      vitD: { type: Number, default: 0 },
    },

    // O Diário de Hoje
    dailyLog: {
      date: { type: Date, default: Date.now },
      // Totais
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
      // 👇 LISTA DE REFEIÇÕES INDIVIDUAIS
      meals: [{
        name: { type: String },
        calories: { type: Number },
        protein: { type: Number },
        carbs: { type: Number },
        fat: { type: Number },
        image: { type: String } // Opcional: se quiseres guardar a foto um dia
      }]
    },

    // O Arquivo Passado
    history: [{
      date: { type: Date },
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
      metGoal: { type: Boolean },
      // 👇 TAMBÉM GUARDAMOS AQUI
      meals: [{
        name: { type: String },
        calories: { type: Number },
        protein: { type: Number },
        carbs: { type: Number },
        fat: { type: Number }
      }]
    }]
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);