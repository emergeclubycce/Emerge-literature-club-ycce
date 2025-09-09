import React from "react";
import { Inter } from "next/font/google";
import Nav from "../components/reuseable/reusable-home/nav";
import Image from "next/image";

const inter = Inter({
   subsets: ["latin"],
  variable: "--font-inter",
});

function Page() {
  return (
    <>
      <Nav />
      <main
        className={`${inter.className} min-h-screen w-full flex-col items-center justify-center`}
      >
        {/* Heading */}
        <h2
          className={`${inter.className} text-3xl sm:text-4xl text-gray-500 text-center font-bold mb-6 mt-20`}
        >
          Events
        </h2>

        {/* Events Grid */}
        <div className="min-h-screen w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 sm:p-10">
          {/* Card */}
          <div className="h-fit border-2 p-4 rounded-2xl border-gray-200 flex flex-col">
            <div className="h-60 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src="/image/event1.JPG"
                alt="event"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xs text-slate-500">2025 Oct</h1>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-600">
              Farzi Mushaira
            </h1>
            <p className="text-sm leading-5 text-zinc-400">
              Farzi Mushaira is a satirical comedy show that parodies traditional
              Urdu poetry gatherings with humorous, fake shayari.
            </p>
          </div>

          {/* Copy 2 */}
          <div className="h-fit border-2 p-4 rounded-2xl border-gray-200 flex flex-col">
            <div className="h-60 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src="/image/event1.JPG"
                alt="event"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xs text-slate-500">2025 Oct</h1>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-600">
              Farzi Mushaira
            </h1>
            <p className="text-sm leading-5 text-zinc-400">
              Farzi Mushaira is a satirical comedy show that parodies traditional
              Urdu poetry gatherings with humorous, fake shayari.
            </p>
          </div>

          {/* Copy 3 */}
          <div className="h-fit border-2 p-4 rounded-2xl border-gray-200 flex flex-col">
            <div className="h-60 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src="/image/event1.JPG"
                alt="event"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xs text-slate-500">2025 Oct</h1>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-600">
              Farzi Mushaira
            </h1>
            <p className="text-sm leading-5 text-zinc-400">
              Farzi Mushaira is a satirical comedy show that parodies traditional
              Urdu poetry gatherings with humorous, fake shayari.
            </p>
          </div>

             <div className="h-fit border-2 p-4 rounded-2xl border-gray-200 flex flex-col">
            <div className="h-60 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src="/image/event1.JPG"
                alt="event"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xs text-slate-500">2025 Oct</h1>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-600">
              Farzi Mushaira
            </h1>
            <p className="text-sm leading-5 text-zinc-400">
              Farzi Mushaira is a satirical comedy show that parodies traditional
              Urdu poetry gatherings with humorous, fake shayari.
            </p>
          </div>

                  <div className="h-fit border-2 p-4 rounded-2xl border-gray-200 flex flex-col">
            <div className="h-60 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src="/image/event1.JPG"
                alt="event"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xs text-slate-500">2025 Oct</h1>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-600">
              Farzi Mushaira
            </h1>
            <p className="text-sm leading-5 text-zinc-400">
              Farzi Mushaira is a satirical comedy show that parodies traditional
              Urdu poetry gatherings with humorous, fake shayari.
            </p>
          </div>
                  <div className="h-fit border-2 p-4 rounded-2xl border-gray-200 flex flex-col">
            <div className="h-60 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src="/image/event1.JPG"
                alt="event"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="mt-2 text-xs text-slate-500">2025 Oct</h1>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-600">
              Farzi Mushaira
            </h1>
            <p className="text-sm leading-5 text-zinc-400">
              Farzi Mushaira is a satirical comedy show that parodies traditional
              Urdu poetry gatherings with humorous, fake shayari.
            </p>
          </div>
          
        </div>

        

        {/* Footer */}
        <footer className="w-full border-t border-gray-300 flex flex-col items-center justify-center py-6">
          <div className="h-20 w-20 rounded-full overflow-hidden border border-gray-400">
            <Image
              src="/image/image.png"
              alt="logo"
              width={100}
              height={100}
              className="object-cover"
            />
          </div>
          <h1 className="mt-6 text-center text-sm sm:text-base px-4 text-gray-600">
            Designed & Developed with ❤️ by Muchkundraje Thote
          </h1>
        </footer>
      </main>
    </>
  );
}

export default Page;
