"use client"
import React from 'react'
import { Inter } from 'next/font/google'
import Nav from '../components/reuseable/reusable-home/nav'
import Image from 'next/image'
import { useLenis } from '@/utils/lenis'

const inter = Inter({
   subsets: ["latin"], 
  variable:"--font-inter"
})

function page() {
 
 
 
  useLenis()
 
 
  return (
    <>
   
   <main className={`${inter.className} h-screen w-full p-4 mt-60 flex flex-col items-center justify-center `}>
    
  <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>About Us</h2>
    
    <div className='h-[80vh] mt-10 w-[80%] relative bg-slate-200 rounded-2xl flex items-center justify-center'>
       <h1 className= {` ${inter.className} font-bold absolute -top-10 text-2xl  text-gray-500 `}>Emerge <span className='text-sky-500'>Family</span> </h1>
    <Image src='/image/team.jpg' alt='logo' width={800} height={600}/>
    </div>
  <h2 className={` ${inter.className} text-2xl text-gray-500 text-center font-bold  mt-10`}>About Emerge Literature club Ycce</h2>
<p className={`${inter.className} w-[80%] mt-2 text-center text-gray-500 mb-3 `} >
Founded on 13th June 2020, Emerge is a vibrant community of poets, writers, and creative thinkers united by their love for words. What began as a small circle of expression has now grown into one of the most active literary clubs, nurturing talent and giving voice to emotions that often remain unspoken. Through events like Guftagu, Antotgatva, and Grand Stand, the club has provided a platform for emerging artists to share their stories, perform original pieces, and connect with a like-minded audience. Over the years, Emerge has celebrated art in all its forms — poetry, storytelling, music, and visual creativity — while fostering confidence, collaboration, and cultural expression among its members. Rooted in passion and driven by purpose, Emerge continues to inspire individuals to speak their truth, celebrate diversity, and keep the essence of literature alive.
</p>
    <footer className='h-50 w-full p-10 border-t-[1px] border-gray-300  mt-5 flex flex-col items-center justify-center'>
                <div className='h-15 w-15 rounded-full overflow-hidden border-[1px] border-gray-400  '>
                         <Image src='/image/logo.png' alt='logo' width={100} height={100} />
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