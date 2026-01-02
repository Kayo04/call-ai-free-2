import mongoose from "mongoose";

// Esquema da Refeição Individual
const MealSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  
  // 👇 AGORA O SEGURANÇA JÁ DEIXA ESTES ENTRAR
  fiber: Number,
  sugar: Number,
  sodium: Number,
  cholesterol: Number,
  potassium: Number,
  calcium: Number,
  iron: Number,
  vitC: Number,
  vitD: Number,
  
  // 👇 E A HORA TAMBÉM
  time: String 
});

// Esquema do Dia Completo
const DayLogSchema = new mongoose.Schema({
  date: Date,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  
  // Totais do dia
  fiber: Number,
  sugar: Number,
  sodium: Number,
  
  meals: [MealSchema], // Lista de refeições
  metGoal: Boolean
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  password: { type: String, select: false },
  
  // Metas do utilizador
  goals: {
     calories: Number,
     protein: Number,
     carbs: Number,
     fat: Number,
     fiber: Number,
     sugar: Number,
     sodium: Number,
     cholesterol: Number,
     potassium: Number,
     calcium: Number,
     iron: Number,
     vitC: Number,
     vitD: Number,
  },
  
  dailyLog: DayLogSchema,
  history: [DayLogSchema],
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

// Evita erro de re-compilação do modelo
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;