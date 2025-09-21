import { doc, setDoc } from "firebase/firestore";
import { db } from "../../src/app/config/firebaseConfig"

export const saveUserToDB = async (user: any) => {
  try {
    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        photoURL: user.photoURL,
        role:"user",
        createdAt: new Date(),
    });
    console.log("User saved to DB");
  } catch (error) {
    console.error("Error saving user:", error);
  }
};


