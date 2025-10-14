"use client"
import React from 'react'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import { useLenis } from '@/utils/lenis'
import Nav from '../components/reuseable/reusable-home/nav'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
})

function page() {
  useLenis()

  return (
    <>
      <main
        className={`${inter.className} min-h-screen w-full px-4 md:px-10 py-20 flex flex-col items-center justify-center`}
      >
        <h2 className="text-3xl  md:text-4xl text-gray-500 text-center font-bold mb-10">
          About Us
        </h2>

        {/* Team Section */}
        <div className="relative bg-slate-200 rounded-2xl flex items-center justify-center w-full sm:w-[90%] md:w-[80%] overflow-hidden shadow-md">
          <h1 className="font-bold absolute -top-6 sm:-top-8 md:-top-10 text-xl sm:text-2xl md:text-3xl text-gray-500">
            Emerge <span className="text-sky-500">Family</span>
          </h1>
          <div>
          <Image
            src="/image/team.jpg"
            alt="Emerge Team"
            width={800}
            height={600}
            className=" w-full h-auto object-cover"
          />

          </div>
        </div>

        {/* About Section */}
        <h2 className="text-2xl sm:text-3xl text-gray-500 text-center font-bold mt-10">
          About Emerge Literature Club YCCE
        </h2>

        <p className="w-full sm:w-[90%] md:w-[80%] mt-3 text-center text-gray-500 leading-relaxed text-sm sm:text-base md:text-lg mb-10">
          Founded on 13th June 2020, Emerge is a vibrant community of poets, writers, and creative
          thinkers united by their love for words. What began as a small circle of expression has now
          grown into one of the most active literary clubs, nurturing talent and giving voice to
          emotions that often remain unspoken. Through events like Guftagu, Antotgatva, and Grand
          Stand, the club has provided a platform for emerging artists to share their stories,
          perform original pieces, and connect with a like-minded audience. Over the years, Emerge
          has celebrated art in all its forms — poetry, storytelling, music, and visual creativity —
          while fostering confidence, collaboration, and cultural expression among its members.
          Rooted in passion and driven by purpose, Emerge continues to inspire individuals to speak
          their truth, celebrate diversity, and keep the essence of literature alive.
        </p>

        {/* Footer */}
        <footer className="w-full border-t border-gray-300 mt-5 py-10 flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 rounded-full overflow-hidden border border-gray-400 flex items-center justify-center">
            <Image src="/image/logo.png" alt="logo" width={100} height={100} className="object-cover" />
          </div>

          <h1 className="mt-6 text-gray-600 text-sm sm:text-base">
            Designed & Developed with ❤️ by <span className="font-semibold">Muchkundraje Thote</span>
          </h1>
        </footer>
      </main>
    </>
  )
}

export default page
