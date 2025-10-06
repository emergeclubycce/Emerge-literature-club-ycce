/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React from 'react'
import { Inter } from 'next/font/google'

import Profilecard from '../components/team/profilecard'
import Image from 'next/image'
import { useLenis } from '@/utils/lenis'
import { core, semicore, vp } from '@/database/team'

const inter = Inter({
   subsets: ["latin"],
  variable:"--font-inter"
})

function page() {
  useLenis();
  return (
    
    <>
  
   <main className={`${inter.className} min-h-screen w-full flex flex-col  pt-30  items-center justify-center `}>
    <h2 className={` ${inter.className} text-5xl  text-sky-500 text-center font-bold mb-10`}>Team Emerge</h2>
     <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}> President </h2>
    <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
          <Profilecard name={'Jagdish Kachhawah '} post={"President"} index={19}/>
    </div>

   <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Vice President</h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
        
        {vp.map((val ,inx)=>(
            <Profilecard key={inx} name={val.name} post={val.post} index={val.index}/>

          ))}
         
    </div>

       <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Core Emerge </h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
          
          {core.map((val ,i)=>(
            <Profilecard key={i} name={val.name} post={val.post} index={val.index}/>

          ))}
        
    </div>

        <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Semi Core Emerge </h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
        {semicore.map((val ,i)=>(
            <Profilecard key={i} name={val.name} post={val.post} index={val.index} />

          ))}
         
    </div>


          <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Website Developer By</h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
          <Profilecard name={"Muchkundraje Thote"} post={"Technical Head"} index={2}/>
       
         
    </div>



     <footer className='h-50 w-full border-t-[1px] border-gray-300  flex flex-col items-center justify-center'>
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