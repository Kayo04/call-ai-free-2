import mongoose from "mongoose";

// Esquema da Refeição Individual
const MealSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  
  // Nutrientes Extra
  fiber: Number,
  sugar: Number,
  sodium: Number,
  cholesterol: Number,
  potassium: Number,
  calcium: Number,
  iron: Number,
  vitC: Number,
  vitD: Number,
  
  // Hora
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
  
  meals: [MealSchema], 
  metGoal: Boolean
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  password: { type: String, select: false },

  // 👇 NOVO: Informações do Perfil (Essencial para o novo Onboarding)
  info: {
    age: Number,
    weight: Number,
    height: Number,
    gender: String,
    activity: String,
    goal: String,
    targetWeight: Number,
    targetDate: Date,
    bodyFat: Number // 👈 AQUI ESTÁ A CHAVE PARA A LÓGICA "GREEK GOD"
  },
  
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