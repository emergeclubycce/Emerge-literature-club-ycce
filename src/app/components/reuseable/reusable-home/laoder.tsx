"use client"
import React, { useEffect } from 'react'
import { gsap } from 'gsap'

function Loader() {
    useEffect(() => {
        // Create a timeline for better control
        const tl = gsap.timeline()
        
        // Initial state - hide elements
        gsap.set(['.suniyo-1', '.suniyo-2'], {
           
            opacity: 0,
        })
        
        // Pop animation sequence
        tl.to('.suniyo-1', {
          
            opacity: 1,
           
            duration: 0.6,
            
        }).to('.suniyo-1', {
       
            duration: 0.3,
            ease: "power2.out"
        })
       
        .to('.suniyo-2', {
       
            opacity: 1,
           
            duration: 0.6,
            ease: "baunce"
        }, "-=0.3") // Start 0.3s before previous animation ends
        .to('.suniyo-2', {
 
            duration: 0.3,
            ease: "power2.out"
        })

        .to(".poetry-word",{
            opacity:1,
            x:2,
            stagger:0.6, 
            duration:1.5,
            ease:"power3"
        })
  
        // Fixed selector - needs to be a class or ID selector
          
        tl.to(".loader", {
            opacity:0,
            display:"none",
            duration: 1.2,
           
            ease: "back.out(1.7)"
        },"same")
         
          
       
        
    }, [])

    return (
        <div className='loader emerge fixed z-50 text-white h-screen w-full flex-col gap-2 bg-sky-600 flex items-center justify-center'>
            <div className='flex items-center gap-4'>
                <h1 className='suniyo-1 text-2xl opacity-0'>Suniye</h1>
                <h1 className='suniyo-2 text-2xl opacity-0'>Suniye</h1>
            </div>
            <h1 className=' wrap  text-3xl flex gap-3  '>
                <span className='poetry-word opacity-0 inline-block'> Ke</span>
               <span className='poetry-word opacity-0 inline-block'> Arz</span>  
                <span className='poetry-word opacity-0 inline-block'> kia</span>
                <span className='poetry-word opacity-0 inline-block'> he</span>  
                  <span className='poetry-word opacity-0 inline-block'> Ki...</span>  </h1>
        </div>
    )
}

export default Loader