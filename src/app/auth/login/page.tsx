import React from 'react'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import GoogleLogin from '@/app/components/auth/GoogleLogin'
import PaginationLogin from '@/app/components/reuseable/reusable-home/loginpagination'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

function page() {
  return (
    <>
      <main
        className={`${inter.className} h-screen w-full flex flex-col md:flex-row`}
      >
        {/* Left Section */}
        <div className="hidden md:flex h-1/2 md:h-full md:w-1/2">
          <PaginationLogin />
        </div>

        {/* Right Section */}
        <div className="h-full md:w-1/2 w-full flex items-center justify-center flex-col p-4">
          <div className="h-auto w-[90%] sm:w-[25rem] p-8 gap-4 flex flex-col rounded-2xl items-center justify-center border-2 border-gray-200 shadow-sm">
            {/* Logo */}
            <div className="h-20 w-20 rounded-full overflow-hidden border border-gray-400 flex items-center justify-center">
              <Image
                src="/image/logo.png"
                alt="logo"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>

            {/* Heading */}
            <h2
              className={`${inter.className} text-2xl text-gray-600 text-center font-bold`}
            >
              Login
            </h2>

            {/* Description */}
            <p className="w-full sm:w-60 text-sm font-medium text-gray-500 text-center leading-relaxed">
              Welcome back to Emerge Literature Club, the space where words
              breathe, emotions unfold, and stories come alive. Every poem,
              speech, and performance here is more than just an act — it’s a
              reflection of thought, creativity, and passion.
            </p>

            {/* Google Login Button */}
            <div className="w-full flex justify-center mt-2">
              <GoogleLogin />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default page
