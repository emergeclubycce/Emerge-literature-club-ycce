
import React from 'react'
import { Inter } from 'next/font/google'
import Nav from '../components/reuseable/reusable-home/nav'


const inter = Inter({
  variable:"--font-inter"
})

function page() {
  return (
    <>
    <Nav/>
   <main className={`${inter.className} h-screen w-full flex items-center justify-center `}>
    <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>About Us</h2>
   </main>
    </>
  )
}

export default page