import mongoose from "mongoose";

// Esquema da Refeição Individual
const MealSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  
  // Nutrientes Detalhados
  fiber: Number,
  sugar: Number,
  sodium: Number,
  cholesterol: Number,
  potassium: Number,
  calcium: Number,
  iron: Number,
  vitC: Number,
  vitD: Number,
  magnesium: Number,
  zinc: Number,
  omega3: Number,
  vitB12: Number,
  vitB9: Number,
  selenium: Number,
  
  time: String 
});

// 👇 AQUI É IMPORTANTE: O Esquema do Dia tem de ter os Totais também!
const DayLogSchema = new mongoose.Schema({
  date: Date,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  
  // Totais do Dia (Estavam a faltar alguns aqui)
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  cholesterol: { type: Number, default: 0 },
  potassium: { type: Number, default: 0 },
  calcium: { type: Number, default: 0 },
  iron: { type: Number, default: 0 },
  vitC: { type: Number, default: 0 },
  vitD: { type: Number, default: 0 },
  magnesium: { type: Number, default: 0 },
  zinc: { type: Number, default: 0 },
  omega3: { type: Number, default: 0 },
  vitB12: { type: Number, default: 0 },
  vitB9: { type: Number, default: 0 },
  selenium: { type: Number, default: 0 },
  
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
  
  goals: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    // Metas opcionais
    fiber: Number,
    sugar: Number,
    sodium: Number,
    cholesterol: Number,
    potassium: Number,
    calcium: Number,
    iron: Number,
    vitC: Number,
    vitD: Number,
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;