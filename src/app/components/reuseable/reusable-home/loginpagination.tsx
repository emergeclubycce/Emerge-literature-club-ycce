"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

// Import only the modules you need
import { Autoplay, Pagination } from 'swiper/modules';

export default function PaginationLogin() {
  return (
    <>
      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 1000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        modules={[Autoplay, Pagination]} // Removed Navigation
        className="mySwiper"
      >
        <SwiperSlide className='w-full h-full  m-auto '>Slide 1
            <div className='h-full w-full flex items-center justify-center  '>
                  <div className='h-[60%] w-96 '>
                   <Image 
                             src={`/image/login-2.png`}
                             alt="profile" 
                              fill
                             className="object-contain"
                           />

                  </div>
            </div>


        
        </SwiperSlide>
      
      </Swiper>
    </>
  );
}
