"use client"

import React from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useEffect } from 'react'
import Maquee from './components/reuseable/reusable-home/maquee'
import Nav from './components/reuseable/reusable-home/nav'
import Laoder from './components/reuseable/reusable-home/laoder'
import { LayoutGridDemo } from './components/reuseable/reusable-home/layout-grid'
import { Inter } from 'next/font/google';
import { MoveRight } from 'lucide-react'
import Timeline from './components/reuseable/reusable-home/timeline'
import SherCard from './components/reuseable/reusable-home/sher-card'
import { AccordionDemo } from './components/reuseable/reusable-home/accordion'
import ClickSpark from './components/reuseable/reusable-home/reusable-clcikup-animation'

const inter = Inter({
 subsets: ["latin"],
  variable: '--font-inter', // should match the font name
});



function Page() {

 

  return (

    <>
    <Laoder/>
    <Nav/>
   
   {/* page1 */}
   
   <ClickSpark
  sparkColor='#00A6F4'
  sparkSize={10}
  sparkRadius={15}
  sparkCount={8}
  duration={400}
>
  <main className='no-select min-h-screen  w-full overflow-hidden scrollbar-hide pb-10 '>



   <div className=' relative h-screen  w-full flex flex-col items-center justify-center text-black font-bold  overflow-hidden'>
        <Image  draggable={false}  src='/image/cardborad.png' alt='logo' width={700} height={200} className='image absolute z-30 md:-bottom-20 md:-left-50 bottom-10 -left-50   '/>
        <Image  draggable={false} src='/image/cardborad.png' alt='logo' width={700} height={200} className='image absolute  md:-top-30 md:-left-60  -top-10 -left-45 z-30 md:z-10  '/>
        <Image  draggable={false} src='/image/cardborad.png' alt='logo' width={700} height={200} className='image absolute rotate-180 -bottom-10 -right-40  z-30 md:z-10 md:-bottom-20 md:right-10'/>
        
     
     <div className='screen-wrap  h-[80%]  flex-col w-[96%] md:w-[80%] z-20 flex items-center justify-center shadow-xl '>
          <Image draggable={false} src='/image/logo-2.png' alt='logo' width={700} height={200} className='image'/>
           <button className={` ${inter.className} px-3 py-2  text-white bg-sky-500 font-medium  mt-2 rounded-2xl md:hidden flex gap-2  `}>Get Started  <MoveRight className='group-hover:translate-x-1 transition-all'/></button>
     </div>  
       
      <Maquee/>
    </div>




    {/* Page 2 */}

      <div className={` ${inter.className} min-h-[100vh] w-full  flex flex-col z-10   overflow-hidden items-center py-30 justify-center text-black font-bold `}>
      
        <div>
         <h2 className={` ${inter.className} text-4xl text-gray-500 text-center`}>Our <span className='text-sky-500'>Events</span> & Activities</h2>
         <p className='font-light text-center'>A glimpse of our poetry, passion, and creative expression Emerge Poetry Club, YCCE.</p>
        </div>
       <LayoutGridDemo/> 
           <div className="group h-full w-full  flex items-center justify-center gap-1 cursor-pointer">
        <h1 className=" relative font-medium before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-0 before:h-[1px] before:bg-sky-500 before:rounded-2xl hover:before:w-full before:transition-all  text-gray-600 ">View All Event</h1>
       <MoveRight className='group-hover:translate-x-1 transition-all'/>
        </div>   
     </div>

    {/* Page 3 */}
    <div className='min-h-screen w-full '>
         <div className={` ${inter.className} font-bold mb-40`}>
         <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold`}>Our <span className='text-sky-500 '>Timeline</span> </h2>
         <p className='font-medium text-gray-500  text-center'>A journey of poetic milestones and creative expression at Emerge Poetry Club, YCCE.</p>
        </div>
         <Timeline/>
    </div>

    <div className='h-screen w-full relative flex items-center gap-3 justify-center mt-20'>
           <Image draggable={false} src='/image/paper.png' alt='logo'  width={1100} height={600}   className=' absolute hidden md:block' />
           <Image draggable={false} src='/image/paper.png' alt='logo'  fill  className=' absolute md:hidden block' />

           
           <div className='h-full w-full flex  flex-col items-center justify-center z-20'>
             <div className='h-15 w-15 rounded-full overflow-hidden border-[1px] border-gray-400  '>
                      <Image src='/image/image.png' alt='logo' width={100} height={100} />
                     </div>
                <h2 className={`emerge text-4xl text-black text-center`}>About</h2>
                <p className={`${inter.className} font-medium text-2xl mt-3 text-center`}> Emerge <span>Poetry</span> Club | YCCE.</p>

                <p className={` ${inter.className} text-center w-80 md:w-[40rem] mt-3`}> 
                  Emerge Poetry Club is the heart of poetic expression at YCCE a space where words breathe, emotions flow, and creativity thrives. We celebrate the art of storytelling through verses, spoken word, and lyrical narratives. From soulful open mics to powerful slam poetry events, we give voice to the thoughts that often go unspoken.
                </p>
                 <p className={` ${inter.className} text-center w-80 md:w-[40rem] mt-10`}> 
                   Whether you re a seasoned poet or just beginning to rhyme your thoughts, Emerge is your stage to grow, express, and inspire. Join us, and let your words emerge.
                </p>

                   <div className="group flex items-center justify-center mt-10 gap-1 cursor-pointer">
        <h1 className=" relative font-medium before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-0 before:h-[2px] before:bg-sky-500 before:rounded-2xl hover:before:w-full before:transition-all  text-gray-600 ">Know More About Us</h1>
       <MoveRight className='group-hover:translate-x-1 transition-all'/>
        </div>   
           </div>   
    </div>


   <div className='h-screen w-full relative flex items-center gap-3 justify-center mt-20'>
              
           <div className='h-full w-full flex  flex-col items-center justify-center z-20'>
             <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold mb-10`}>Checkout Our <span className='text-sky-500 '>Shers</span> Section </h2>
             <SherCard/>

                   <div className="group flex items-center justify-center mt-10 gap-1 cursor-pointer">
        <h1 className=" relative font-medium before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-0 before:h-[2.5px] before:bg-sky-500 before:rounded-2xl hover:before:w-full before:transition-all  text-gray-600 ">See Shers Section</h1>
       <MoveRight className='group-hover:translate-x-1 transition-all'/>
        </div>   
           </div>   
    </div>


      <div className='h-[100vh] w-full relative flex flex-col items-center gap-3 p-5 mt-40 md:p-30 justify-start md:mt-20'>
            <h2 className={` ${inter.className} text-4xl text-gray-500 text-center font-bold `}>Frequently Asked  <span className='text-sky-500 '>Questions</span>  </h2>
            <div className='h-full w-full flex items-start mt-20 justify-center'>
           <AccordionDemo/>

            </div>
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

</ClickSpark>






    </>
  )
}

export default Page