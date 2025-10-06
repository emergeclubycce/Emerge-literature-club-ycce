import React from 'react'
import Image from 'next/image'
import { Instagram, LucideLinkedin } from 'lucide-react'

interface profileProb{
  name:string,
  post:string,
  index:number
}




function ProfileCard({name,post,index}:profileProb) {
  return (
    <div className="h-[28rem] w-80 border p-2 border-zinc-200 bg-white shadow-2xl rounded-2xl overflow-hidden">
      <div className="relative h-[90%] w-full rounded-t-2xl overflow-hidden">
        {/* Profile Image */}
        <Image 
          src={`./Team-Image/${index}.jpg `}
          alt="profile" 
          fill 
          className="object-cover"
        />
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 w-full h-30 bg-gradient-to-t from-white to-transparent"></div>
      <div className='h-30 w-10  absolute top-0 right-0 p-2 flex flex-col gap-3 '>
            <div className='h-6 w-6 outline-2 outline-zinc-500 shadow-2xl  rounded-2xl bg-white cursor-pointer flex items-center justify-center'>
               <LucideLinkedin fill='#0073B2' color='#0073B2' size={15}/>
            </div>
             <div className='h-6 w-6   rounded-2xl bg-white cursor-pointer flex items-center justify-center'>
               <Instagram   size={15}/>
            </div>
      </div>
      </div>

      {/* Text Content */}
      <div className="relative -m-7 text-center px-4 ">
        <h2 className=" inter font-bold text-xl opacity-90">{name}</h2>
        <p className="text-gray-600">  {post}  </p>
      </div>

      

     

      
    


      

     
    
    </div>
  )
}

export default ProfileCard
