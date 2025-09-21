
import React from 'react'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import GoogleLogin from '@/app/components/auth/GoogleLogin'



const inter = Inter({
   subsets: ["latin"], 
  variable:"--font-inter"
})

function page() {
  return (
    <>

   <main className={`${inter.className} h-screen w-full flex  `}>
    <div className='h-full w-1/2 '>
      <img src="https://i.pinimg.com/originals/e1/da/2e/e1da2e9564468094e1859a155ad391f8.gif" alt="" className='h-full w-full object-cover' />
    </div>
       <div className='h-full w-1/2 flex items-center justify-center flex-col '>
       <div className='h-80 w-80 p-10 gap-3  flex flex-col rounded-2xl  items-center justify-center border-2 border-gray-200'>
   <div className='h-15 w-15 rounded-full overflow-hidden border-[1px] border-gray-400  '>
          <Image src='/image/image.png' alt='logo' width={100} height={100} />
         </div>
         <h2 className={` ${inter.className} text-xl text-gray-500 text-center font-bold  `}>Login</h2>
          <GoogleLogin/>
       </div>

    </div>
   </main>
    </>
  )
}

export default page