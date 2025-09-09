import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { div } from "motion/react-client"


export function AccordionDemo() {
  return (
    <>
    <div className="w-96 md:w-[70%]">
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger> What is Emerge Poetry Club?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance transition-all">
          <p>
         Emerge is YCCE's official poetry club—a space where writers, performers, and lovers of poetry unite to express, perform, and grow together.
          </p>
         
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger> Who can join the club?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
 Anyone from YCCE with a passion for poetry, storytelling, or spoken word can join—whether you're a beginner or a seasoned poet.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What does the club do?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
        We organize poetry slams, open mics, writing workshops, and creative events that celebrate language, expression, and emotion.
          </p>
       
        </AccordionContent>
      </AccordionItem>
            <AccordionItem value="item-4">
        <AccordionTrigger> How often are events held?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
      Events are held monthly, with regular meets and surprise collabs. Stay tuned to our socials for updates!
          </p>
       
        </AccordionContent>
      </AccordionItem>      <AccordionItem value="item-5">
        <AccordionTrigger>Is it only in Hindi or English?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
      Not at all! We embrace multilingual creativity—Hindi, English, Marathi, Urdu, or any language you write in.
          </p>
       
        </AccordionContent>
      </AccordionItem>  
    </Accordion>

    </div>
    
    </>
  )
}
