/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import React from 'react'
import { Inter } from 'next/font/google'

import SherCard from '../components/reuseable/reusable-home/sher-card'
import { useLenis } from '@/utils/lenis'
import Image from 'next/image'
import { sher } from '@/database/team'
import Footer from '../components/reuseable/reusable-home/Footer'





const inter = Inter({
   subsets: ["latin"], 
  variable:"--font-inter"
})

function page() {
  useLenis();
 
  return (
    <>
  
    
   <main className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-center `}>
    <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mt-20 mb-10`}>Sher-Shayari</h2>
    <div className='min-h-100vh w-full p-2 mb-20 gap-2  flex flex-col items-center justify-center'>
{
  sher.map((val ,ind)=>(
    
    <SherCard key={ind} writter={val.writter} image={val.image} caption={val.caption} idx={ind} name={val.name} />

  ))
}    
         
    </div>
    <Footer/>
   </main>

    </>
  )
}

export default page