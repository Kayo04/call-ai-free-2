import mongoose from "mongoose";

// Esquema da Refeição Individual (Já estava bem, mas confirmamos)
const MealSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  
  // Nutrientes Clássicos
  fiber: Number,
  sugar: Number,
  sodium: Number,
  cholesterol: Number,
  potassium: Number,
  calcium: Number,
  iron: Number,
  vitC: Number,
  vitD: Number,

  // Novos Nutrientes
  magnesium: Number,
  zinc: Number,
  omega3: Number,
  vitB12: Number,
  vitB9: Number,
  selenium: Number,
  
  time: String 
});

// 👇 AQUI ESTAVA O PROBLEMA: FALTAVAM CAMPOS NO 'DayLogSchema'
const DayLogSchema = new mongoose.Schema({
  date: Date,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  
  // Totais do dia (Adicionei todos os que faltavam!)
  fiber: Number,
  sugar: Number,
  sodium: Number,
  cholesterol: Number,
  potassium: Number,
  calcium: Number,
  iron: Number,
  vitC: Number,
  vitD: Number,
  
  // Novos Totais
  magnesium: Number,
  zinc: Number,
  omega3: Number,
  vitB12: Number,
  vitB9: Number,
  selenium: Number,
  
  meals: [MealSchema], 
  metGoal: Boolean
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  password: { type: String, select: false },

  info: {
    age: Number,
    weight: Number,
    height: Number,
    gender: String,
    activity: String,
    goal: String,
    targetWeight: Number,
    targetDate: Date,
    bodyFat: Number
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
    // Novos
    magnesium: Number,
    zinc: Number,
    omega3: Number,
    vitB12: Number,
    vitB9: Number,
    selenium: Number
  },
  
  dailyLog: DayLogSchema,
  history: [DayLogSchema],
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

// Evita erro de re-compilação do modelo
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;