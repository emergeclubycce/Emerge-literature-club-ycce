"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../../config/firebaseConfig";
import { useRouter } from "next/navigation"; 
import React from "react";
import { saveUserToDB } from "@/utils/db";
import  supabase  from "@/config/supabase";


function GoogleLogin() {
    const navigate =  useRouter()
    const LoginhandlerFuntion = async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const token = await result.user.getIdToken();
        const username = result.user.email;
        const userImage = result.user.photoURL;
    
        const payload = {
          token,
          username,
          userImage,
        };
        
        localStorage.setItem("currentuser", JSON.stringify(payload));
         
        await saveUserToDB(result.user)
        navigate.push("/")
        
      } catch (error) {
        console.error("Login failed", error);
      }
    };

   const handleGoogleLogin = async () => {
  const redirectUrl =
    import.meta.env.MODE === "development"
      ? "http://localhost:3000/"
      : "https://your-vercel-domain.vercel.app/";

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl },
  });

  if (error) console.error("Google login error:", error);
};

  return (
    <button
      onClick={handleGoogleLogin}
      className="text-white rounded p-2 px-5 bg-sky-500"
    >
      Google Login
    </button>
  );
}

export default GoogleLogin;
