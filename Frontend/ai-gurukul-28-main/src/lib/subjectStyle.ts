export function subjectColor(subject: string | null | undefined) {
  const s = (subject || "").toLowerCase();
  if (s.includes("math")) return { strip: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700", emoji: "➗" };
  if (s.includes("science") && !s.includes("computer") && !s.includes("social"))
    return { strip: "bg-green-500", badge: "bg-green-100 text-green-700", emoji: "🔬" };
  if (s.includes("english")) return { strip: "bg-orange-500", badge: "bg-orange-100 text-orange-700", emoji: "📖" };
  if (s.includes("hindi")) return { strip: "bg-red-500", badge: "bg-red-100 text-red-700", emoji: "🕉" };
  if (s.includes("history")) return { strip: "bg-amber-500", badge: "bg-amber-100 text-amber-800", emoji: "🏛" };
  if (s.includes("geography")) return { strip: "bg-teal-500", badge: "bg-teal-100 text-teal-700", emoji: "🌍" };
  if (s.includes("computer")) return { strip: "bg-blue-500", badge: "bg-blue-100 text-blue-700", emoji: "💻" };
  if (s.includes("physics")) return { strip: "bg-blue-500", badge: "bg-blue-100 text-blue-700", emoji: "⚛" };
  if (s.includes("chemistry")) return { strip: "bg-green-500", badge: "bg-green-100 text-green-700", emoji: "🧪" };
  if (s.includes("biology")) return { strip: "bg-green-500", badge: "bg-green-100 text-green-700", emoji: "🧬" };
  return { strip: "bg-purple-500", badge: "bg-purple-100 text-purple-700", emoji: "📘" };
}

export const SUBJECTS = [
  "Mathematics", "Science", "English Language", "Hindi", "History",
  "Geography", "Social Studies", "Physics", "Chemistry", "Biology",
  "Computer Science", "Art & Craft", "Physical Education", "Sanskrit", "Economics", "Other"
];

export const GRADES = [
  "Pre-Primary (KG)", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "College Level"
];

export const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Odia"];
