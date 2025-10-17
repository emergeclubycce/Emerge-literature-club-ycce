/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React from 'react'
import { Inter } from 'next/font/google'

import Profilecard from '../components/team/profilecard'
import Image from 'next/image'
import { useLenis } from '@/utils/lenis'
import { core, semicore, vp } from '@/database/team'
import Footer from '../components/reuseable/reusable-home/Footer'

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
          <Profilecard name={'Jagdish Kachhawah '} post={"President"} index={19} linkedIn='https://www.linkedin.com/in/jagdish-kachhawah-21jk?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app' instagram='https://www.instagram.com/mc_sukuna?igsh=MXBkY3J5NTAxYm41'/>
    </div>

   <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Vice President</h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
        
        {vp.map((val ,inx)=>(
            <Profilecard key={inx} name={val.name} post={val.post} index={val.index} linkedIn = {val.Linkedin} instagram ={val.Instagram}/>

          ))}
         
    </div>

       <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Core Emerge </h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
          
          {core.map((val ,i)=>(
            <Profilecard key={i} name={val.name} post={val.post} index={val.index}  linkedIn = {val.Linkedin ?? ""} instagram ={val.Instagram  ?? ""}/>

          ))}
        
    </div>

        <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Semi Core Emerge </h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
        {semicore.map((val ,i)=>(
            <Profilecard key={i} name={val.name} post={val.post} index={val.index}  linkedIn = {val.Linkedin ?? ""} instagram ={val.Instagram ?? ""} />

          ))}
         
    </div>


          <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Website Developed By</h2>
      <div className='min-h-30 w-full  flex flex-wrap items-center gap-4 mb-40  justify-center' >
          <Profilecard name={"Muchkundraje Thote"} post={"Technical Head"} index={2} linkedIn='' instagram=' '  />
       
         
    </div>



     <Footer/>
   </main>
    </>
  )
}

export default page