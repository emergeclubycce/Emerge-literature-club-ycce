/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React from 'react'
import { Inter } from 'next/font/google'
import Nav from '../components/reuseable/reusable-home/nav'
import Profilecard from '../components/team/profilecard'
import Image from 'next/image'
import { useLenis } from '@/utils/lenis'

const inter = Inter({
   subsets: ["latin"],
  variable:"--font-inter"
})

function page() {
  useLenis();
  return (
    
    <>
    <Nav/>
   <main className={`${inter.className} min-h-screen w-full flex flex-col  pt-30  items-center justify-center `}>
    <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Team</h2>
    <div className='min-h-screen w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
          <Profilecard/>
           <Profilecard/>
            <Profilecard/>
             <Profilecard/>
              <Profilecard/>
               <Profilecard/>
    </div>
     <footer className='h-50 w-full border-t-[1px] border-gray-300  flex flex-col items-center justify-center'>
                 <div className='h-15 w-15 rounded-full overflow-hidden border-[1px] border-gray-400  '>
                          <Image src='/image/image.png' alt='logo' width={100} height={100} />
                 </div>
                
                  <h1 className='mt-10 text-center px-2'>
                         Designed & Developed with ❤️ by Muchkundraje thote 
                  </h1>
       </footer>
   </main>
    </>
  )
}

export default page