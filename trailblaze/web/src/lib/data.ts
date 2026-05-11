export const KENYAN_COUNTIES = [
  "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita-Taveta","Garissa","Wajir","Mandera",
  "Marsabit","Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua",
  "Nyeri","Kirinyaga","Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia",
  "Uasin Gishu","Elgeyo-Marakwet","Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado",
  "Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia","Siaya","Kisumu","Homa Bay",
  "Migori","Kisii","Nyamira","Nairobi"
];

export const CATEGORIES = ["Adventure","View","Hiking","Cave","Forest","Waterfall","Other"] as const;
export type Category = typeof CATEGORIES[number];

// Normalize backend lowercase categories to display format
export function normalizeCategory(cat: string): Category {
  const map: Record<string, Category> = {
    adventure: "Adventure", view: "View", hiking: "Hiking",
    cave: "Cave", forest: "Forest", waterfall: "Waterfall", other: "Other",
  };
  return map[cat.toLowerCase()] ?? (cat as Category);
}
