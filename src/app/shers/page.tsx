
import React from 'react'
import { Inter } from 'next/font/google'
import Nav from '../components/reuseable/reusable-home/nav'
import SherCard from '../components/reuseable/reusable-home/sher-card'


const inter = Inter({
   subsets: ["latin"], 
  variable:"--font-inter"
})

function page() {
  return (
    <>
    <Nav/>
   <main className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-center `}>
    <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mt-20 mb-10`}>Shers</h2>
    <div className='min-h-100vh w-full p-2  flex flex-col items-center justify-center'>
            <SherCard/>
              <SherCard/>
         
         
    </div>
   </main>
    </>
  )
}

export default page